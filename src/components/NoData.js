// src/components/NoData.js - Complete fix with all required props
import { Box, Card, CircularProgress, Typography } from '@mui/material';
import { memo } from 'react';
import { USA_STATE_CODE } from '../constants';
import useMap from '../hooks/useMap';
import useRouting from '../routes/useRouting';
import AnimatedEnter from './AnimatedEnter';
import { ResponsiveGeoMap } from './GeoMap';

const NoData = memo(() => {
  const { stateCode = USA_STATE_CODE } = useRouting();
  const { data, error, isLoading } = useMap(
    stateCode,
    stateCode !== USA_STATE_CODE,
  );

  // Ensure data is always an array
  const features = Array.isArray(data) ? data : [];


  return (
    <AnimatedEnter>
      <Box
        style={{
          width: '50vw',
          height: '90vh',
          margin: '0 auto',
          padding: 18,
          position: 'relative',
        }}>
        {/* Loading */}
        {isLoading && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%">
            <Card>
              <Box padding={4} display="flex" alignItems="center" gap={2}>
                <CircularProgress size={24} />
                <Typography>Loading map...</Typography>
              </Box>
            </Card>
          </Box>
        )}

        {/* Error */}
        {error && !isLoading && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%">
            <Card>
              <Box padding={4}>
                <Typography variant="h6" color="error">
                  ⚠️ Map Error
                </Typography>
                <Typography variant="body2">{error.message}</Typography>
              </Box>
            </Card>
          </Box>
        )}

        {/* Map with features - COMPLETE PROPS LIST */}
        {features.length > 0 && !isLoading && !error && (
          <>
            <ResponsiveGeoMap
              features={features}
              projectionType="mercator"
              projectionScale={100}
              projectionTranslation={[0.5, 0.5]}
              projectionRotation={[0, 0, 0]}
              fitProjection
              fillColor="#dddddd"
              borderWidth={2}
              borderColor="#404040"
              isInteractive
              layers={['features']}
              onMouseEnter={() => {}}
              onMouseMove={() => {}}
              onMouseLeave={() => {}}
              onClick={() => {}}
              tooltip={null}
            />

            {/* Overlay */}
            <Box
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}>
              <Card style={{ pointerEvents: 'auto' }}>
                <Box padding={4} textAlign="center">
                  <Typography variant="h5">
                    🚧 Data to be added soon!
                  </Typography>
                  <Typography variant="caption">
                    {features.length} map regions loaded
                  </Typography>
                </Box>
              </Card>
            </Box>
          </>
        )}

        {/* No features */}
        {features.length === 0 && !isLoading && !error && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%">
            <Card>
              <Box padding={4} textAlign="center">
                <Typography variant="h6">🗺️ No map data</Typography>
                <Typography variant="body2">State: {stateCode}</Typography>
              </Box>
            </Card>
          </Box>
        )}
      </Box>
    </AnimatedEnter>
  );
});

export default NoData;
