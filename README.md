# Simple S3 signer
[![npm version](https://badge.fury.io/js/simple-s3-signer.svg)](https://badge.fury.io/js/simple-s3-signer)

This library will give you a presigned S3 URL, with very few options.

## Example

```typescript
import { signedS3Url } from "simple-s3-signer";

const signed = signedS3Url({
    bucket: "mybucket",
    key: "/my-object-key",
    region: "us-east-1",
    accessKeyId: "AWS_ACCESSS_KEY_ID",
    secretAccessKey: "AWS_SECRET_ACCESS_KEY"
});

fetch(signed).then(...);
```
