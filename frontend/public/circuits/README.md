# eERC Circuit Files

This directory should contain the compiled circuit files for the eERC protocol:

- RegistrationCircuit.wasm
- RegistrationCircuit.groth16.zkey
- TransferCircuit.wasm
- TransferCircuit.groth16.zkey
- MintCircuit.wasm
- MintCircuit.groth16.zkey
- WithdrawCircuit.wasm
- WithdrawCircuit.groth16.zkey

These files are generated from the eERC protocol's circom circuits and are required for zero-knowledge proof generation.

For development, you can:

1. Download them from the eERC protocol repository
2. Use the ones from the 3dent example
3. Generate them using the eERC build process

Without these files, the eERC SDK will not be able to generate proofs for encrypted operations.
