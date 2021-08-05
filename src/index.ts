import { hash, hmac } from "fast-sha256";

export interface SignUrl {
  bucket: string;
  key: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  domain?: string;
}

const te = new TextEncoder();

const encode = (s: string) => te.encode(s);

const pad = (n: number | string) => ("00" + n).slice(-2);

const formatDate = (timestamp: Date) => {
  const year = timestamp.getUTCFullYear();
  const month = pad(timestamp.getUTCMonth() + 1);
  const day = pad(timestamp.getUTCDate());
  const date = year + month + day;
  const hours = pad(timestamp.getUTCHours());
  const minutes = pad(timestamp.getUTCMinutes());
  const seconds = pad(timestamp.getUTCSeconds());

  return [date, date + "T" + hours + minutes + seconds + "Z"];
};

const formatScope = (date: string, region: string): string =>
  `${date}/${region}/s3/aws4_request`;

const uint8arrayToHex = (arr: Uint8Array): string =>
  Array.from(arr)
    .map(b => pad(b.toString(16)))
    .join("");

export const signedS3Url = (opts: SignUrl) => {
  const host = `${opts.bucket}.s3.${opts.domain ? opts.domain : `amazonaws.com`}`;

  const [date, time] = formatDate(new Date());
  const scope = formatScope(date, opts.region);

  const queryString =
    `X-Amz-Algorithm=AWS4-HMAC-SHA256&` +
    `X-Amz-Credential=${encodeURIComponent(`${opts.accessKeyId}/${scope}`)}&` +
    `X-Amz-Date=${time}&` +
    `X-Amz-Expires=86400&` +
    `X-Amz-SignedHeaders=host`;

  const canonicalRequest =
    `GET\n` +
    `${opts.key}\n` +
    `${queryString}\n` +
    `host:${host}\n\n` +
    `host\nUNSIGNED-PAYLOAD`;

  const hashedCanonicalRequest = uint8arrayToHex(
    hash(encode(canonicalRequest))
  );

  const stringToSign = `AWS4-HMAC-SHA256\n${time}\n${scope}\n${hashedCanonicalRequest}`;

  const dateKey = hmac(encode(`AWS4${opts.secretAccessKey}`), encode(date));
  const dateRegionKey = hmac(dateKey, encode(opts.region));
  const dateRegionServiceKey = hmac(dateRegionKey, encode("s3"));
  const signingKey = hmac(dateRegionServiceKey, encode("aws4_request"));

  const signature = uint8arrayToHex(hmac(signingKey, encode(stringToSign)));

  return `https://${host}${opts.key}?${queryString}&X-Amz-Signature=${signature}`;
};
