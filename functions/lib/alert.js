export async function sendFailureAlert(env, lead, ghlError) {
  if (!env.ALERT_EMAIL) return { sent: false, reason: 'ALERT_EMAIL not configured' };
  const clientName = env.CLIENT_NAME || 'Dealer Website';
  const subject = '[' + clientName + '] Lead saved — GHL failed — ACTION NEEDED';
  const body = ['A website lead was saved to the Lead Vault Google Sheet but did not reach GoHighLevel.', '', 'Submission ID: ' + lead.submissionId, 'Name: ' + lead.fullName, 'Email: ' + lead.email, 'Phone: ' + lead.phone, 'Product: ' + (lead.productName || 'n/a'), 'Page: ' + (lead.pageUrl || 'n/a'), '', 'GHL error:', ghlError].join('\n');
  if (env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: env.ALERT_FROM || (clientName + ' <leads@example.com>'), to: [env.ALERT_EMAIL], subject, text: body }) });
    return { sent: res.ok, status: res.status, provider: 'resend' };
  }
  return { sent: false, reason: 'No email provider configured' };
}
