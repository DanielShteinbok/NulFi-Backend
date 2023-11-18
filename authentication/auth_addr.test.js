const auth_addr = require('./auth_addr');

test('recovers auth address from given legacy transaction', async () => {
  signedTransactionSerialized= 'f868158502540be400825208940c54fccd2e384b4bb6f2e405bf5cbc15a017aafb80808401546d71a0cc02cda3b70183735fe69a5dafdbd91de69614c7eeb452d4edfa5ca8d11f7965a035e1960c849287421ead7a0ed482fb115bde95fb2492115f42a20e784fb1a12f';
  from_addr = '0x6E3E27B40Ccaf1458fF76eCE21049Ea191F766cE'
    expect(await auth_addr.getAddress(signedTransactionSerialized)).toBe(from_addr);
});
