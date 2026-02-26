import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
} from '@mui/material';
import {
  SportsTennis,
  Dashboard,
  PlayArrow,
  People,
  Logout,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface NavButtonProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ active, icon, label, onClick }) => (
  <Button
    startIcon={icon}
    onClick={onClick}
    sx={{
      color: active ? '#00E5A0' : '#8B9EC4',
      backgroundColor: active ? 'rgba(0,229,160,0.08)' : 'transparent',
      borderRadius: 1.5,
      px: 2,
      py: 0.875,
      fontSize: '0.875rem',
      fontWeight: active ? 600 : 500,
      letterSpacing: '0.01em',
      position: 'relative',
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: '20%',
        right: '20%',
        height: '2px',
        backgroundColor: '#00E5A0',
        borderRadius: '2px 2px 0 0',
        opacity: active ? 1 : 0,
        transition: 'opacity 0.15s ease',
      },
      '&:hover': {
        color: '#EFF2F8',
        backgroundColor: 'rgba(255,255,255,0.05)',
        '&::after': {
          opacity: active ? 1 : 0.3,
        },
      },
      transition: 'color 0.15s ease, background-color 0.15s ease',
    }}
  >
    {label}
  </Button>
);

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isActive = (path: string) => location.pathname === path;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/login');
  };

  return (
    <AppBar position="sticky" sx={{ top: 0, zIndex: 1100, mb: 0 }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ height: 64 }}>
          {/* Brand */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', mr: 5, cursor: 'pointer', flexShrink: 0 }}
            onClick={() => navigate('/')}
          >
            <Box sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(0,229,160,0.2), rgba(0,229,160,0.06))',
              border: '1px solid rgba(0,229,160,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1.5,
            }}>
              <SportsTennis sx={{ fontSize: 20, color: '#00E5A0' }} />
            </Box>
            <Typography sx={{
              fontFamily: '"Bebas Neue", cursive',
              fontSize: '1.35rem',
              letterSpacing: '0.14em',
              color: '#EFF2F8',
              lineHeight: 1,
              userSelect: 'none',
            }}>
              SHUTTLE<span style={{ color: '#00E5A0' }}>COACH</span>
            </Typography>
          </Box>

          {/* Nav Links */}
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <NavButton
              active={isActive('/')}
              icon={<PlayArrow fontSize="small" />}
              label="Training"
              onClick={() => navigate('/')}
            />
            <NavButton
              active={isActive('/performance')}
              icon={<Dashboard fontSize="small" />}
              label="Performance"
              onClick={() => navigate('/performance')}
            />
            <NavButton
              active={isActive('/athletes')}
              icon={<People fontSize="small" />}
              label="Athletes"
              onClick={() => navigate('/athletes')}
            />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* User Avatar */}
          <IconButton onClick={handleMenuOpen} sx={{ p: 0.25 }}>
            <Avatar sx={{
              width: 36,
              height: 36,
              background: 'linear-gradient(135deg, #00E5A0, #00C48C)',
              color: '#0A0F1C',
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 700,
              fontSize: '0.9rem',
              boxShadow: '0 0 12px rgba(0,229,160,0.3)',
            }}>
              {user?.username?.charAt(0).toUpperCase() || '?'}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            sx={{ mt: 1 }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#EFF2F8' }}>
                {user?.username}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#8B9EC4', mt: 0.25 }}>
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ gap: 1.5, mt: 0.5 }}>
              <Logout fontSize="small" sx={{ color: '#F87171' }} />
              <Typography sx={{ fontSize: '0.875rem', color: '#F87171' }}>Logout</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navigation;
