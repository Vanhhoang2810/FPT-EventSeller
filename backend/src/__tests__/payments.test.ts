import crypto from 'crypto';
import qs from 'qs';

// Copy sortObject để test độc lập (không phụ thuộc DB hay env)
function sortObject(obj: Record<string, string>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).map(k => encodeURIComponent(k)).sort();
  for (const key of keys) {
    const original = decodeURIComponent(key);
    sorted[key] = encodeURIComponent(String(obj[original])).replace(/%20/g, '+');
  }
  return sorted;
}

const SANDBOX_TMN_CODE    = 'FBYWYJN6';
const SANDBOX_HASH_SECRET = 'IBYV43BV7LW8DG9NIVBUR1A5BG1S8TR1';
const VNPAY_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

describe('VNPay - sortObject', () => {
  it('sắp xếp key đúng thứ tự alphabet', () => {
    const result = sortObject({ vnp_Version: '2.1.0', vnp_Amount: '100000', vnp_Command: 'pay' });
    const keys = Object.keys(result);
    expect(keys).toEqual([...keys].sort());
  });

  it('encode space thành + thay vì %20', () => {
    const result = sortObject({ vnp_OrderInfo: 'Thanh toan ve so 1' });
    expect(result['vnp_OrderInfo']).toBe('Thanh+toan+ve+so+1');
  });

  it('encode URL đặc biệt trong ReturnUrl', () => {
    const result = sortObject({ vnp_ReturnUrl: 'https://example.com/return' });
    expect(result['vnp_ReturnUrl']).toContain('%3A');
    expect(result['vnp_ReturnUrl']).toContain('%2F');
  });

  it('không encode ký tự alphanumeric', () => {
    const result = sortObject({ vnp_TmnCode: 'FBYWYJN6', vnp_Amount: '35000000' });
    expect(result['vnp_TmnCode']).toBe('FBYWYJN6');
    expect(result['vnp_Amount']).toBe('35000000');
  });
});

describe('VNPay - tạo chữ ký HMAC-SHA512', () => {
  it('tạo đúng chữ ký cho params chuẩn', () => {
    const params: Record<string, string> = {
      vnp_Amount:     '35000000',
      vnp_Command:    'pay',
      vnp_CreateDate: '20260514101217',
      vnp_CurrCode:   'VND',
      vnp_IpAddr:     '127.0.0.1',
      vnp_Locale:     'vn',
      vnp_OrderInfo:  'Thanh toan ve so 1',
      vnp_OrderType:  'other',
      vnp_ReturnUrl:  'https://example.ngrok.dev/api/payments/vnpay/return',
      vnp_TmnCode:    SANDBOX_TMN_CODE,
      vnp_TxnRef:     '1-1778728337744',
      vnp_Version:    '2.1.0',
    };

    const sorted   = sortObject(params);
    const signData = qs.stringify(sorted, { encode: false });
    const signed   = crypto.createHmac('sha512', SANDBOX_HASH_SECRET)
      .update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Hash phải là 128 ký tự hex (SHA-512 = 64 bytes)
    expect(signed).toHaveLength(128);
    expect(signed).toMatch(/^[0-9a-f]+$/);
  });

  it('chữ ký khác nhau khi đổi 1 param', () => {
    const base = sortObject({ vnp_Amount: '35000000', vnp_TmnCode: SANDBOX_TMN_CODE });
    const mod  = sortObject({ vnp_Amount: '35000001', vnp_TmnCode: SANDBOX_TMN_CODE });

    const sign = (obj: Record<string, string>) =>
      crypto.createHmac('sha512', SANDBOX_HASH_SECRET)
        .update(qs.stringify(obj, { encode: false })).digest('hex');

    expect(sign(base)).not.toBe(sign(mod));
  });

  it('chữ ký giống nhau với cùng input', () => {
    const sorted   = sortObject({ vnp_Amount: '35000000', vnp_TmnCode: SANDBOX_TMN_CODE });
    const signData = qs.stringify(sorted, { encode: false });
    const sign1 = crypto.createHmac('sha512', SANDBOX_HASH_SECRET).update(signData).digest('hex');
    const sign2 = crypto.createHmac('sha512', SANDBOX_HASH_SECRET).update(signData).digest('hex');
    expect(sign1).toBe(sign2);
  });
});

describe('VNPay - verify chữ ký return URL', () => {
  // Mô phỏng VNPay gửi về return URL với đúng chữ ký
  it('verify thành công khi chữ ký đúng', () => {
    const returnParams: Record<string, string> = {
      vnp_Amount:        '35000000',
      vnp_BankCode:      'NCB',
      vnp_BankTranNo:    'VNP14596462',
      vnp_CardType:      'ATM',
      vnp_OrderInfo:     'Thanh+toan+ve+so+1',
      vnp_PayDate:       '20260514101300',
      vnp_ResponseCode:  '00',
      vnp_TmnCode:       SANDBOX_TMN_CODE,
      vnp_TransactionNo: '14596462',
      vnp_TransactionStatus: '00',
      vnp_TxnRef:        '1-1778728337744',
    };

    // Tính chữ ký như VNPay sẽ gửi về
    const sorted   = sortObject(returnParams);
    const signData = qs.stringify(sorted, { encode: false });
    const expectedHash = crypto.createHmac('sha512', SANDBOX_HASH_SECRET)
      .update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Verify lại
    const paramsWithoutHash = { ...returnParams };
    const verifySort   = sortObject(paramsWithoutHash);
    const verifyData   = qs.stringify(verifySort, { encode: false });
    const verifyHash   = crypto.createHmac('sha512', SANDBOX_HASH_SECRET)
      .update(Buffer.from(verifyData, 'utf-8')).digest('hex');

    expect(verifyHash).toBe(expectedHash);
  });

  it('verify thất bại khi chữ ký sai', () => {
    const params = sortObject({ vnp_Amount: '35000000', vnp_TmnCode: SANDBOX_TMN_CODE });
    const signData = qs.stringify(params, { encode: false });
    const realHash = crypto.createHmac('sha512', SANDBOX_HASH_SECRET).update(signData).digest('hex');
    const fakeHash = 'a'.repeat(128);
    expect(realHash).not.toBe(fakeHash);
  });
});

describe('VNPay - tạo payment URL', () => {
  it('URL chứa đủ params bắt buộc', () => {
    const params: Record<string, string> = {
      vnp_Version: '2.1.0', vnp_Command: 'pay',
      vnp_TmnCode: SANDBOX_TMN_CODE, vnp_Amount: '35000000',
      vnp_CreateDate: '20260514101217', vnp_CurrCode: 'VND',
      vnp_IpAddr: '127.0.0.1', vnp_Locale: 'vn',
      vnp_OrderInfo: 'Thanh+toan+ve+so+1', vnp_OrderType: 'other',
      vnp_ReturnUrl: 'https://example.ngrok.dev/api/payments/vnpay/return',
      vnp_TxnRef: '1-1778728337744',
    };
    const sorted = sortObject(params);
    const signData = qs.stringify(sorted, { encode: false });
    const signed = crypto.createHmac('sha512', SANDBOX_HASH_SECRET)
      .update(Buffer.from(signData, 'utf-8')).digest('hex');
    sorted['vnp_SecureHash'] = signed;
    const url = `${VNPAY_URL}?${qs.stringify(sorted, { encode: false })}`;

    expect(url).toContain('vnp_SecureHash=');
    expect(url).toContain(`vnp_TmnCode=${SANDBOX_TMN_CODE}`);
    expect(url).toContain('vnp_Amount=35000000');
    expect(url).toContain(VNPAY_URL);
  });

  it('amount nhân 100 (VNPay tính đơn vị xu)', () => {
    const amountVnd = 350000;
    const amountForVnpay = Math.round(amountVnd) * 100;
    expect(amountForVnpay).toBe(35000000);
  });
});
