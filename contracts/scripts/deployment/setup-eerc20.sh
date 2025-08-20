#!/bin/bash

# ShadowFlow eERC20 Infrastructure Setup Script
# This script sets up the complete eERC20 infrastructure on local Subnet-EVM

set -e

echo "🚀 Starting ShadowFlow eERC20 Infrastructure Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NETWORK_NAME="shadowflowsubnet"
CHAIN_ID=43113
RPC_URL="http://127.0.0.1:9650/ext/bc/C/rpc"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v forge &> /dev/null; then
        print_error "Foundry (forge) is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v avalanche &> /dev/null; then
        print_error "Avalanche CLI is not installed. Please install it first."
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Setup environment variables
setup_environment() {
    print_status "Setting up environment variables..."
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
        else
            print_error ".env.example file not found. Creating basic .env file..."
            cat > .env << EOF
# Private key for deployment (DO NOT commit this to version control)
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Network configuration
RPC_URL=http://127.0.0.1:9650/ext/bc/C/rpc
CHAIN_ID=43113

# eERC20 Configuration
TOKEN_NAME="ShadowFlow Token"
TOKEN_SYMBOL="SFT"
DECIMALS=18
INITIAL_SUPPLY=1000000000000000000000000
EOF
        fi
    fi
    
    # Source environment variables
    source .env
    print_success "Environment variables loaded"
}

# Start local Avalanche network
start_network() {
    print_status "Starting local Avalanche network..."
    
    # Check if network is already running
    if curl -s -X POST --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' \
       -H "Content-Type: application/json" $RPC_URL > /dev/null 2>&1; then
        print_warning "Network is already running"
        return 0
    fi
    
    # Start the network
    print_status "Starting Avalanche network..."
    avalanche network start --network-dir ~/.avalanche-cli/networks || {
        print_warning "Network start failed, trying to create and start..."
        avalanche network create $NETWORK_NAME --force || true
        avalanche network start --network-dir ~/.avalanche-cli/networks
    }
    
    # Wait for network to be ready
    print_status "Waiting for network to be ready..."
    for i in {1..30}; do
        if curl -s -X POST --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' \
           -H "Content-Type: application/json" $RPC_URL > /dev/null 2>&1; then
            print_success "Network is ready"
            return 0
        fi
        sleep 2
    done
    
    print_error "Network failed to start within timeout"
    exit 1
}

# Compile contracts
compile_contracts() {
    print_status "Compiling smart contracts..."
    
    forge build
    
    if [ $? -eq 0 ]; then
        print_success "Contracts compiled successfully"
    else
        print_error "Contract compilation failed"
        exit 1
    fi
}

# Deploy eERC20 infrastructure
deploy_contracts() {
    print_status "Deploying eERC20 infrastructure..."
    
    # Deploy contracts using Foundry script
    forge script script/DeployEERC20.s.sol \
        --rpc-url $RPC_URL \
        --private-key $PRIVATE_KEY \
        --broadcast \
        --verify \
        --etherscan-api-key dummy \
        -vvvv
    
    if [ $? -eq 0 ]; then
        print_success "eERC20 infrastructure deployed successfully"
    else
        print_error "Deployment failed"
        exit 1
    fi
}

# Update configuration with deployed addresses
update_config() {
    print_status "Updating configuration with deployed addresses..."
    
    if [ -f "deployment-addresses.json" ]; then
        # Extract addresses from deployment file
        USER_REGISTRAR=$(jq -r '.userRegistrar' deployment-addresses.json)
        BALANCE_MANAGER=$(jq -r '.encryptedBalanceManager' deployment-addresses.json)
        EERC20_TOKEN=$(jq -r '.eERC20Token' deployment-addresses.json)
        
        # Update eerc20.config.json
        jq --arg ur "$USER_REGISTRAR" \
           --arg bm "$BALANCE_MANAGER" \
           --arg et "$EERC20_TOKEN" \
           '.contracts.userRegistrar = $ur | .contracts.encryptedBalanceManager = $bm | .contracts.eERC20Token = $et' \
           eerc20.config.json > eerc20.config.json.tmp && mv eerc20.config.json.tmp eerc20.config.json
        
        print_success "Configuration updated with deployed addresses"
    else
        print_warning "deployment-addresses.json not found, skipping config update"
    fi
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    if [ -f "deployment-addresses.json" ]; then
        USER_REGISTRAR=$(jq -r '.userRegistrar' deployment-addresses.json)
        BALANCE_MANAGER=$(jq -r '.encryptedBalanceManager' deployment-addresses.json)
        EERC20_TOKEN=$(jq -r '.eERC20Token' deployment-addresses.json)
        
        print_status "Deployed contracts:"
        echo "  UserRegistrar: $USER_REGISTRAR"
        echo "  EncryptedBalanceManager: $BALANCE_MANAGER"
        echo "  EERC20Token: $EERC20_TOKEN"
        
        # Test basic functionality
        print_status "Testing basic functionality..."
        
        # Check if contracts are deployed by calling a view function
        cast call $USER_REGISTRAR "getTotalUsers()" --rpc-url $RPC_URL > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            print_success "UserRegistrar is responding"
        else
            print_error "UserRegistrar is not responding"
        fi
        
        cast call $EERC20_TOKEN "name()" --rpc-url $RPC_URL > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            print_success "EERC20Token is responding"
        else
            print_error "EERC20Token is not responding"
        fi
        
        print_success "Deployment verification completed"
    else
        print_error "deployment-addresses.json not found"
        exit 1
    fi
}

# Main execution
main() {
    echo "=================================================="
    echo "🔒 ShadowFlow eERC20 Infrastructure Setup"
    echo "=================================================="
    
    check_dependencies
    setup_environment
    start_network
    compile_contracts
    deploy_contracts
    update_config
    verify_deployment
    
    echo "=================================================="
    print_success "🎉 eERC20 Infrastructure Setup Complete!"
    echo "=================================================="
    echo ""
    echo "📋 Next Steps:"
    echo "  1. Check deployment-addresses.json for contract addresses"
    echo "  2. Use 'forge test' to run the test suite"
    echo "  3. Start building your ShadowFlow campaigns!"
    echo ""
    echo "🔗 Useful Commands:"
    echo "  - View network status: avalanche network status"
    echo "  - Stop network: avalanche network stop"
    echo "  - Run tests: forge test"
    echo "  - Check balances: cast balance <address> --rpc-url $RPC_URL"
}

# Run main function
main "$@"