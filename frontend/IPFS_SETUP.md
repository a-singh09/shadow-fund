# IPFS Setup Guide for ShadowFlow

This guide explains how to set up real IPFS image uploading for the ShadowFlow campaign platform.

## Current Status

- ✅ **Mock Implementation**: Currently working with fake IPFS hashes for demo
- 🔧 **Real Implementation**: Ready to use with proper API keys
- 📁 **Files**: `ipfs.ts` (main), `ipfs-real.ts` (production), `ImageUpload.tsx` (UI)

## Quick Setup Options

### Option 1: Pinata (Recommended)

Pinata is the most reliable IPFS service with excellent performance.

1. **Sign up**: Go to [pinata.cloud](https://pinata.cloud/) and create account
2. **Get JWT Token**:
   - Go to API Keys section
   - Create new key with admin permissions
   - Copy the JWT token
3. **Configure**:
   ```bash
   # Add to your .env file
   VITE_PINATA_JWT=your_jwt_token_here
   ```

### Option 2: Web3.Storage (Free Alternative)

Web3.Storage offers free IPFS storage backed by Filecoin.

1. **Sign up**: Go to [web3.storage](https://web3.storage/)
2. **Get Token**: Create API token in dashboard
3. **Configure**:
   ```bash
   # Add to your .env file
   VITE_WEB3_STORAGE_TOKEN=your_token_here
   ```

### Option 3: Browser IPFS (Local)

Use local IPFS node or browser extension.

1. **Install**: [IPFS Desktop](https://github.com/ipfs/ipfs-desktop) or [IPFS Companion](https://github.com/ipfs/ipfs-companion)
2. **No config needed**: Automatically detected by the app

## How It Works

### Current Mock Implementation

```typescript
// Generates fake hash like: Qm1234567890abcdef...
const mockHash = generateMockIPFSHash(file);
// Returns fake URL: https://ipfs.io/ipfs/Qm1234567890abcdef...
```

### Real Implementation Flow

```typescript
// 1. Validates file (type, size)
// 2. Uploads to configured IPFS service
// 3. Returns real IPFS hash and URL
// 4. Image becomes accessible worldwide via IPFS
```

## Testing the Setup

1. **Add environment variables** to `.env`
2. **Upload an image** in campaign creation
3. **Check console** for success/error messages
4. **Verify URL** - real IPFS URLs should work globally

## Environment Variables

Create a `.env` file in the frontend directory:

```bash
# Copy from .env.example and fill in your values
cp .env.example .env

# Edit with your API keys
nano .env
```

## Troubleshooting

### Common Issues

1. **"No IPFS service configured"**

   - Add environment variables to `.env`
   - Restart development server

2. **"Upload failed: 401 Unauthorized"**

   - Check API key/JWT token is correct
   - Verify token has upload permissions

3. **"CORS error"**

   - Some IPFS services require domain whitelisting
   - Check service dashboard settings

4. **"Image not loading"**
   - IPFS propagation can take time
   - Try different gateway URLs
   - Check if hash is valid

### Debug Mode

Enable debug logging:

```typescript
// In ipfs-real.ts, add:
console.log("Uploading to IPFS:", file.name, file.size);
console.log("Using service:", hasRealIPFS ? "real" : "mock");
```

## Production Considerations

### Security

- **Never expose API keys** in client-side code
- Use **server-side proxy** for sensitive operations
- Implement **rate limiting** to prevent abuse

### Performance

- **Compress images** before upload (already implemented)
- Use **multiple gateways** for redundancy
- Implement **caching** for frequently accessed images

### Reliability

- **Backup strategy**: Store hashes in database
- **Gateway fallbacks**: Multiple IPFS gateways
- **Error handling**: Graceful degradation

## Advanced Setup

### Server-Side Proxy (Recommended for Production)

Instead of direct client uploads, use a server proxy:

```typescript
// api/upload-image.ts
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  // Upload to IPFS server-side
  const result = await uploadToIPFS(file);

  return Response.json(result);
}
```

### Multiple Service Fallback

The implementation already tries multiple services:

1. Pinata (if configured)
2. Web3.Storage (if configured)
3. Browser IPFS (if available)
4. Mock (for development)

## Cost Considerations

- **Pinata**: Free tier (1GB), paid plans available
- **Web3.Storage**: Free (backed by Filecoin)
- **Infura**: Free tier (5GB/month), paid plans
- **Self-hosted**: Free but requires infrastructure

## Next Steps

1. **Choose a service** (Pinata recommended)
2. **Get API credentials**
3. **Add to environment variables**
4. **Test upload functionality**
5. **Deploy with real IPFS**

The implementation is ready - just add your API keys and it will work with real IPFS!
