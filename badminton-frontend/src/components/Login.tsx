import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
} from '@mui/material';
import { SportsTennis } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const courtSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 560" width="900" height="560">
  <rect x="100" y="60" width="700" height="440" fill="none" stroke="%2300E5A0" stroke-width="1.5"/>
  <line x1="450" y1="60" x2="450" y2="500" stroke="%2300E5A0" stroke-width="1"/>
  <line x1="100" y1="173" x2="800" y2="173" stroke="%2300E5A0" stroke-width="0.8"/>
  <line x1="100" y1="387" x2="800" y2="387" stroke="%2300E5A0" stroke-width="0.8"/>
  <line x1="100" y1="120" x2="800" y2="120" stroke="%2300E5A0" stroke-width="0.5"/>
  <line x1="100" y1="440" x2="800" y2="440" stroke="%2300E5A0" stroke-width="0.5"/>
  <line x1="162" y1="60" x2="162" y2="500" stroke="%2300E5A0" stroke-width="0.5"/>
  <line x1="738" y1="60" x2="738" y2="500" stroke="%2300E5A0" stroke-width="0.5"/>
  <line x1="100" y1="280" x2="800" y2="280" stroke="%23F59E0B" stroke-width="1.5"/>
</svg>`;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('[Login] Form submitted', { email, password: '***' });

    try {
      console.log('[Login] Calling login API...');
      await login(email, password);
      console.log('[Login] Login successful, navigating to /');
      navigate('/');
    } catch (err: unknown) {
      console.error('[Login] Login failed:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0D1526',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Court geometry background */}
      <Box sx={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,${courtSvg}")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        opacity: 0.12,
      }} />

      {/* Radial gradient overlay */}
      <Box sx={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,229,160,0.05) 0%, transparent 65%)',
      }} />

      {/* Corner accent blobs */}
      <Box sx={{
        position: 'absolute',
        top: -120,
        right: -80,
        width: 360,
        height: 360,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,229,160,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: -100,
        left: -60,
        width: 280,
        height: 280,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        <Card sx={{
          borderRadius: 2,
          background: 'rgba(14, 22, 38, 0.92)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0,229,160,0.14)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,229,160,0.05)',
        }}>
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box sx={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(0,229,160,0.15), rgba(0,229,160,0.04))',
                border: '1px solid rgba(0,229,160,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2.5,
                boxShadow: '0 0 24px rgba(0,229,160,0.15)',
              }}>
                <SportsTennis sx={{ fontSize: 32, color: '#00E5A0' }} />
              </Box>
              <Typography sx={{
                fontFamily: '"Bebas Neue", cursive',
                letterSpacing: '0.14em',
                fontSize: '2rem',
                color: '#EFF2F8',
                lineHeight: 1,
                mb: 0.75,
              }}>
                SHUTTLE<span style={{ color: '#00E5A0' }}>COACH</span>
              </Typography>
              <Typography sx={{ color: '#8B9EC4', fontSize: '0.83rem', letterSpacing: '0.03em' }}>
                Sign in to your coach account
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                margin="normal"
                autoFocus
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                margin="normal"
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  fontFamily: '"Bebas Neue", cursive',
                  fontSize: '1.05rem',
                  letterSpacing: '0.1em',
                }}
              >
                {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Typography sx={{ fontSize: '0.83rem', color: '#8B9EC4' }}>
                  Don't have an account?{' '}
                  <Link
                    component={RouterLink}
                    to="/register"
                    sx={{ color: '#00E5A0', textDecorationColor: 'rgba(0,229,160,0.4)' }}
                  >
                    Register here
                  </Link>
                </Typography>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Login;
