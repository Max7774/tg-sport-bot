import * as crypto from 'crypto';

export default function validateYooMoneyNotification(
  data: any,
  secret: string,
): boolean {
  const {
    notification_type,
    operation_id,
    amount,
    currency,
    datetime,
    sender,
    codepro,
    label,
    sha1_hash,
  } = data;
  const checkString = `${notification_type}&${operation_id}&${amount}&${currency}&${datetime}&${sender}&${codepro}&${secret}&${label}`;

  const calculatedHash = crypto
    .createHash('sha1')
    .update(checkString)
    .digest('hex');

  return calculatedHash === sha1_hash;
}
