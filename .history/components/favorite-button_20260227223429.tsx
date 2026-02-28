'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

interface FavoriteButtonProps {
  propertyId: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export function FavoriteButton({ propertyId, className = '', size = 'default' }: FavoriteButtonProps) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if property is favorited
  useEffect(() => {
    if (!user) {
      setIsFavorite(false);
      return;
    }

    const checkFavorite = async () => {
      try {
        const { data } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('property_id', propertyId)
          .single();

        setIsFavorite(!!data);
      } catch (err) {
        // Not found is expected
        setIsFavorite(false);
      }
    };

    checkFavorite();
  }, [user, propertyId]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      // Redirect to login
      window.location.href = '/auth/login';
      return;
    }

    setLoading(true);

    try {
      if (isFavorite) {
        // Remove from favorites
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', propertyId);
        setIsFavorite(false);
      } else {
        // Add to favorites
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            property_id: propertyId,
          });
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <Button
      variant="ghost"
      size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
      onClick={handleToggleFavorite}
      disabled={loading}
      className={`${sizeClasses[size]} p-0 hover:bg-red-50 ${className}`}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        size={iconSize[size]}
        className={`transition-colors ${
          isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'
        }`}
      />
    </Button>
  );
}
