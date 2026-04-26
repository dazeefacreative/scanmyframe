# Supabase Email Templates Configuration

## Overview
This guide explains how to set up Supabase email templates to send password reset and email verification links to your application.

## Step 1: Access Email Templates in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your `scanframe` project
3. Navigate to **Authentication → Email Templates**

## Step 2: Configure Password Reset Email

### Enable Password Reset Email

1. Click on **"Confirm reset password request"** template
2. Toggle it **ON** if not already enabled
3. In the template, ensure the following link is present:

```html
{{ .ConfirmationURL }}
```

This automatically generates the reset link with the `access_token` and `type=recovery` parameters.

### Important: Redirect URL
Make sure in **Authentication → URL Configuration**, you have added:
```
http://localhost:2000/reset-password
http://localhost:2000/reset-password
```

Or your production URL:
```
https://yourdomain.com/reset-password
```

## Step 3: Configure Email Verification (Sign Up) Email

### Enable Confirmation Email

1. Click on **"Confirm signup"** template
2. Toggle it **ON** if not already enabled
3. In the template, ensure the following link is present:

```html
{{ .ConfirmationURL }}
```

### Important: Redirect URL
Make sure in **Authentication → URL Configuration**, you have added:
```
http://localhost:5173/verify-email
http://localhost:5173/verify-email
```

Or your production URL:
```
https://yourdomain.com/verify-email
```

## Step 4: Verify Your Redirect URLs

In your Supabase project:

1. Go to **Authentication → URL Configuration**
2. Add the following redirect URLs:
   - **Site URL**: `http://localhost:2000` (or your production domain)
   - **Redirect URLs** (one per line):
     ```
     http://localhost:2000/verify-email
     http://localhost:2000/reset-password
     http://localhost:2000/auth/callback
     https://yourdomain.com/verify-email
     https://yourdomain.com/reset-password
     https://yourdomain.com/auth/callback
     ```

## Step 5: Test Password Reset

1. Go to your app: `http://localhost:2000/dashboard/auth`
2. Click **"Forgot password?"**
3. Enter an email address (ideally one you have access to)
4. Check your email inbox for the password reset link
5. Click the link - it should redirect to `/reset-password`
6. You should see the password reset form

## Step 6: Test Email Verification

1. Go to your app: `http://localhost:2000/dashboard/auth`
2. Click **"Create an account"**
3. Fill in and submit the signup form
4. Check your email inbox for the verification link
5. Click the link - it should redirect to `/verify-email`
6. The page should verify your email automatically

## Troubleshooting

### "Invalid or missing reset link" error
- Check that redirect URLs are added in Supabase
- Ensure the email template uses `{{ .ConfirmationURL }}`
- Check browser console for the actual URL being accessed

### Links not arriving in email
- Check Supabase project **Logs** for email sending errors
- Verify SMTP settings in **Authentication → Providers → Email**
- For free tier, check if you've hit email rate limits

### "Session not found" error
- User's reset link may have expired (typically valid for 1 hour)
- Click "Resend" or go to `/forgot-password` again
- Check that you're using the correct token parameters

## Email Template Examples

### Default Password Reset Link
Supabase automatically generates: `{{ .ConfirmationURL }}`

This produces a link like:
```
http://localhost:2000/reset-password?access_token=YOUR_TOKEN&type=recovery&refresh_token=YOUR_REFRESH_TOKEN
```

### Default Verification Link
Supabase automatically generates: `{{ .ConfirmationURL }}`

This produces a link like:
```
http://localhost:2000/verify-email?access_token=YOUR_TOKEN&type=signup&refresh_token=YOUR_REFRESH_TOKEN
```

## Custom Email Template (Optional)

If you want to customize the email, you can edit the template HTML. Example:

```html
<h2>Reset Your Password</h2>
<p>Click the link below to reset your password:</p>
<a href="{{ .ConfirmationURL }}">Reset Password</a>
<p>If you didn't request this, ignore this email.</p>
```

The `{{ .ConfirmationURL }}` variable is automatically replaced with the correct redirect URL and token.

## Production Checklist

- [ ] Added production domain to Supabase URL Configuration
- [ ] Updated `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for production
- [ ] Tested password reset flow
- [ ] Tested email verification flow
- [ ] Email templates are enabled in Supabase
