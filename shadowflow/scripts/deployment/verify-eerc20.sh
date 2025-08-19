#!/bin/bash

# ShadowFlow eERC20 Infrastructure Verification Script
# This script verifies that the eERC20 infrastructure is working correctly

set -e

echo "🔍 Verifying ShadowFlow eERC20 Infrastructure..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Load environment variables
if [ -f ".env" ]; then
    source .env
    print_status "Environment variables loaded"
else
    print_error ".env file not found"
    exit 1
fi

# Run comprehensive tests
print_status "Running eERC20 infrastructure tests..."
forge test --match-contract EERC20InfrastructureTest

if [ $? -eq 0 ]; then
    print_success "All tests passed!"
else
    print_error "Some tests failed"
    exit 1
fi

# Test deployment script (simulation)
print_status "Testing deployment script..."
forge script script/DeployEERC20.s.sol --private-key $PRIVATE_KEY > /dev/null 2>&1

if [ $? -eq 0 ]; then
    print_success "Deployment script executed successfully"
else
    print_error "Deployment script failed"
    exit 1
fi

# Verify contract compilation
print_status "Verifying contract compilation..."
forge build > /dev/null 2>&1

if [ $? -eq 0 ]; then
    print_success "All contracts compiled successfully"
else
    print_error "Contract compilation failed"
    exit 1
fi

echo "=================================================="
print_success "🎉 eERC20 Infrastructure Verification Complete!"
echo "=================================================="
echo ""
echo "✅ All components verified:"
echo "  - UserRegistrar contract"
echo "  - EncryptedBalanceManager contract"
echo "  - EERC20Token contract"
echo "  - Utility functions"
echo "  - Deployment scripts"
echo "  - Test suite"
echo ""
echo "📋 Infrastructure is ready for ShadowFlow campaign development!"