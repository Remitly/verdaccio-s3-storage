// @flow

import type { LocalStorage, Logger, Config, Callback } from '@verdaccio/types';
import type { ILocalData } from '@verdaccio/local-storage';
import { S3 } from 'aws-sdk';
import type { S3Config } from './config';
import S3PackageManager from './s3PackageManager';
import { convertS3Error, is404Error } from './s3Errors';

export default class S3Database implements ILocalData {
  logger: Logger;
  config: S3Config;
  s3: S3;
  _localData: ?LocalStorage;

  constructor(config: Config, logger: Logger) {
    this.logger = logger;
    // copy so we don't mutate
    if (!config) {
      throw new Error('s3 storage missing config. Add `store.s3-storage` to your config file');
    }
    this.config = Object.assign({}, (config.store: any)['s3-storage']);
    if (!this.config.bucket) {
      throw new Error('s3 storage requires a bucket');
    }
    const configKeyPrefix = this.config.keyPrefix;
    this.config.keyPrefix = configKeyPrefix != null ? (configKeyPrefix.endsWith('/') ? configKeyPrefix : `${configKeyPrefix}/`) : '';
    this.s3 = new S3({
      endpoint: this.config.endpoint,
      region: this.config.region,
      s3ForcePathStyle: this.config.s3ForcePathStyle
    });
  }

  async getSecret(): Promise<any> {
    return Promise.resolve((await this._getData()).secret);
  }

  async setSecret(secret: string): Promise<any> {
    (await this._getData()).secret = secret;
    await this._sync();
  }

  add(name: string, callback: Callback) {
    this._getData().then(async data => {
      if (data.list.indexOf(name) === -1) {
        data.list.push(name);
        try {
          await this._sync();
          callback(null);
        } catch (err) {
          callback(err);
        }
      } else {
        callback(null);
      }
    });
  }

  remove(name: string, callback: Callback) {
    this.get(async (err, data) => {
      if (err) {
        callback(new Error('error on get'));
      }

      const pkgName = data.indexOf(name);
      if (pkgName !== -1) {
        const data = await this._getData();
        data.list.splice(pkgName, 1);
      }

      try {
        await this._sync();
        callback(null);
      } catch (err) {
        callback(err);
      }
    });
  }

  get(callback: Callback) {
    this._getData().then(data => callback(null, data.list));
  }

  // Create/write database file to s3
  async _sync() {
    await new Promise((resolve, reject) => {
      this.s3.putObject(
        {
          Bucket: this.config.bucket,
          Key: `${this.config.keyPrefix}verdaccio-s3-db.json`,
          Body: JSON.stringify(this._localData)
        },
        (err, data) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        }
      );
    });
  }

  // returns an instance of a class managing the storage for a single package
  getPackageStorage(packageName: string): S3PackageManager {
    return new S3PackageManager(this.config, packageName, this.logger);
  }

  async _getData(): Promise<LocalStorage> {
    this._localData = await new Promise((resolve, reject) => {
      this.s3.getObject(
        {
          Bucket: this.config.bucket,
          Key: `${this.config.keyPrefix}verdaccio-s3-db.json`
        },
        (err, response) => {
          if (err) {
            const s3Err = convertS3Error(err);
            if (is404Error(s3Err)) {
              resolve({ list: [], secret: '' });
            } else {
              reject(err);
            }
            return;
          }
          const data = JSON.parse(response.Body.toString());
          resolve(data);
        }
      );
    });
    return this._localData;
  }
}
