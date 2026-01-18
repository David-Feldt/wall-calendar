# Vercel Deployment Checklist

## Quick Deploy Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Deploy on Vercel**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Click "Deploy"

3. **Add Environment Variables**
   After first deployment, go to Project Settings > Environment Variables:
   
   | Variable | Description | Example |
   |----------|-------------|---------|
   | `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID | `123456789.apps.googleusercontent.com` |
   | `GOOGLE_CLIENT_SECRET` | Your Google OAuth Client Secret | `GOCSPX-...` |
   | `GOOGLE_REDIRECT_URI` | Full redirect URI | `https://your-app.vercel.app/api/auth/google/callback` |
   | `NEXT_PUBLIC_BASE_URL` | Your Vercel app URL | `https://your-app.vercel.app` |
   | `OPENWEATHER_API_KEY` | OpenWeatherMap API key | `abc123...` |

4. **Update Google Cloud Console**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - APIs & Services > Credentials
   - Edit your OAuth 2.0 Client ID
   - Add to "Authorized redirect URIs":
     ```
     https://your-app.vercel.app/api/auth/google/callback
     ```
   - Save changes

5. **Redeploy**
   - In Vercel, go to Deployments
   - Click "Redeploy" on the latest deployment
   - This applies the new environment variables

## Important Notes

- ✅ HTTPS is automatic on Vercel (required for OAuth)
- ✅ Environment variables are secure (server-side only)
- ✅ Auto-deploys on every git push
- ⚠️ Remember to update redirect URI in Google Cloud Console
- ⚠️ First deployment will fail auth until redirect URI is updated

## Troubleshooting

**"redirect_uri_mismatch" error:**
- Check that `GOOGLE_REDIRECT_URI` matches exactly in Google Cloud Console
- Make sure it includes `https://` not `http://`
- Redeploy after updating

**"invalid_client" error:**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check for extra spaces when copying/pasting

**Weather not showing:**
- Verify `OPENWEATHER_API_KEY` is set correctly
- Check Vercel function logs for API errors
