# verdaccio-s3-storage

📦 AWS S3 storage plugin for verdaccio 

**Deprecated** This package has been migrated into the verdaccio core monorepo. Please use [`verdaccio-aws-s3-storage`](https://github.com/verdaccio/monorepo/tree/master/plugins/aws-s3-storage) instead.

### Requirements

* AWS Account
* Verdaccio server (>3.0) (see below)

```
npm install -g verdaccio@beta
```

> This plugin is not supported in the version `2.x`

## Usage

```
npm install verdaccio-s3-storage
```

This will pull AWS credentials from your environment.

In your verdaccio config, configure

```yaml
# necessary (see https://github.com/verdaccio/verdaccio/issues/673)
storage: ./storage

store:
  s3-storage:
    bucket: your-s3-bucket
    keyPrefix: some-prefix # optional, has the effect of nesting all files in a subdirectory
    region: us-west-2 # optional, will use aws s3's default behavior if not specified
    endpoint: https://{service}.{region}.amazonaws.com # optional, will use aws s3's default behavior if not specified
    s3ForcePathStyle: false # optional, will use path style URLs for S3 objects
    accessKeyId: your-access-key-id # optional, aws accessKeyId for private S3 bucket
    secretAccessKey: your-secret-access-key # optional, aws secretAccessKey for private S3 bucket
```
