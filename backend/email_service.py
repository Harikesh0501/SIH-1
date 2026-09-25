import os
import json
import urllib.request
import urllib.error
from typing import Optional

def send_otp_email(to_email: str, recipient_name: str, otp_code: str) -> bool:
    """
    Dispatches a high-security tactical registration OTP email using Brevo REST API.
    """
    api_key = os.getenv("BREVO_API_KEY", "").strip()
    sender_email = os.getenv("BREVO_SENDER_EMAIL", "").strip()
    sender_name = os.getenv("BREVO_SENDER_NAME", "RAKSHAK-AAYUSH Defense Portal").strip()

    if not api_key or not sender_email:
        print("[EMAIL] Brevo API Key or Sender Email missing in environment.")
        return False

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "api-key": api_key,
        "Content-Type": "application/json"
    }

    display_name = recipient_name.strip() if recipient_name else "Personnel"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>RAKSHAK-AAYUSH OTP</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 10px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="520px" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              
              <!-- Brand Header -->
              <tr>
                <td style="background-color: #0f172a; padding: 20px 24px; text-align: left;">
                  <table border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="background-color: #f59e0b; color: #0f172a; font-weight: 900; font-size: 14px; width: 28px; height: 28px; text-align: center; border-radius: 6px; line-height: 28px;">R</td>
                      <td style="padding-left: 10px; color: #ffffff; font-weight: 800; font-size: 15px; letter-spacing: 0.5px;">RAKSHAK-AAYUSH (रक्षा-आयुષ)</td>
                    </tr>
                  </table>
                  <div style="color: #94a3b8; font-size: 10px; margin-top: 4px; letter-spacing: 0.3px;">ARMED FORCES PERSONNEL STRESS & WELFARE MONITORING SYSTEM</div>
                </td>
              </tr>

              <!-- Content Body -->
              <tr>
                <td style="padding: 28px 24px; color: #1e293b;">
                  <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 800; color: #0f172a;">Jai Hind, {display_name}</h3>
                  <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 20px; color: #475569;">
                    You are registering for access to the <strong>RAKSHAK-AAYUSH Defense Operational Portal</strong>. Please enter the one-time verification passcode (OTP) below to authenticate your registration:
                  </p>

                  <!-- OTP Display Box -->
                  <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px;">ONE-TIME VERIFICATION CODE</div>
                    <div style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #d97706; font-family: monospace;">{otp_code}</div>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 6px;">VALID FOR 10 MINUTES • DO NOT SHARE</div>
                  </div>

                  <p style="margin: 0 0 12px 0; font-size: 12px; color: #64748b; line-height: 18px;">
                    If you did not initiate this registration, please contact your unit Welfare Officer or IT Security Administrator immediately.
                  </p>
                </td>
              </tr>

              <!-- Statutory Disclaimer Footer -->
              <tr>
                <td style="background-color: #f1f5f9; padding: 14px 24px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #64748b; line-height: 15px; text-align: center;">
                  SEC 21 MHA 2017 & DPDPA 2023 §14 COMPLIANT • MEGHRAJ SOVEREIGN CLOUD READY<br>
                  © 2026 RAKSHAK-AAYUSH Defense Directorate. All rights reserved.
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    payload = {
        "sender": {"name": sender_name, "email": sender_email},
        "to": [{"email": to_email.strip(), "name": display_name}],
        "subject": f"RAKSHAK-AAYUSH Registration OTP: {otp_code}",
        "htmlContent": html_content
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            print(f"[BREVO EMAIL] Dispatched OTP {otp_code} to {to_email}. MessageId: {res_data.get('messageId')}")
            return True
    except urllib.error.HTTPError as http_err:
        print(f"[BREVO EMAIL ERROR] HTTP {http_err.code}: {http_err.read().decode('utf-8')}")
        return False
    except Exception as err:
        print(f"[BREVO EMAIL ERROR] General exception: {err}")
        return False
