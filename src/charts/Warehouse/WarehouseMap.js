import { Box, useTheme } from '@mui/material';
import { TableTooltip } from '@nivo/tooltip';
import { color } from 'd3-color';
import { memo, useEffect, useMemo, useRef } from 'react';
import useSWR from 'swr';
import AnimatedEnter from '../../components/AnimatedEnter';
import Disclaimer from '../../components/Disclaimer';
import { ResponsiveGeoMap } from '../../components/GeoMap';
import {
  API_HOST_URL,
  STATE_CODES,
  STATE_NAMES,
  USA_STATE_CODE,
  FIPS_TO_STATE_CODE,
  getStateCodeFromName,
} from '../../constants';
import { readableNumber } from '../../helpers';
import useMap from '../../hooks/useMap';
import useRouting from '../../routes/useRouting';

export const WarehouseMap = memo(({ setMapHeight = () => {} }) => {
  const { goTo, stateCode = USA_STATE_CODE } = useRouting();
  const { data: features } = useMap(stateCode, stateCode !== USA_STATE_CODE);
  const { data: values } = useSWR(
    `${API_HOST_URL}api/storage/getStorageSummary?stateCode=${stateCode}`,
  );
  const theme = useTheme();

  const mapRef = useRef(null);
  const mapHeight = useMemo(
    () => mapRef?.current?.clientWidth * 1.12963 || 700,
    [mapRef],
  );

  useEffect(
    () => setMapHeight && setMapHeight(mapHeight),
    [mapHeight, setMapHeight],
  );

  // Determine if this is the US country map
  const isUSMap = stateCode === USA_STATE_CODE;

  const mapProps = useMemo(() => {
    if (!values) return {};
    const [minCapacity, maxCapacity] = values.reduce(
      ([accMinCapacity, accMaxCapacity], { warehouses }) => {
        const totalCapacity = warehouses.reduce(
          (capacityTotal, { capacity }) => capacityTotal + capacity,
          0,
        );
        return [
          accMinCapacity < totalCapacity ? accMinCapacity : totalCapacity,
          accMaxCapacity > totalCapacity ? accMaxCapacity : totalCapacity,
        ];
      },
      [Infinity, 0],
    );
    const [capacityOffset, capacityRange] =
      maxCapacity === minCapacity
        ? [0, 1]
        : [minCapacity, maxCapacity - minCapacity];

    const cropColor = color(theme.palette.primary.main);
    const data = values.reduce((acc, { location, warehouses }) => {
      const id =
        stateCode === USA_STATE_CODE ? STATE_NAMES[location] : location;
      const name =
        stateCode === USA_STATE_CODE
          ? STATE_NAMES[location]
          : location.split('-')[1];
      const locationColor = cropColor.copy({
        opacity:
          0.3 +
          (0.7 *
            warehouses.reduce(
              (capacityTotal, { capacity }) => capacityTotal + capacity,
              0,
            ) -
            capacityOffset) /
            capacityRange,
      });
      return {
        ...acc,
        [id]: {
          name,
          locationColor,
          warehouses,
        },
      };
    }, {});

    return {
      fillColor: (props) => {
        const {
          properties: { st_nm: stateName, district: districtName },
        } = props;
        return (
          (stateCode === USA_STATE_CODE
            ? data[stateName]?.locationColor
            : data[`${stateName}-${districtName}`.toUpperCase()]
                ?.locationColor) || '#ffffff'
        );
      },
      onClick: ({
        properties: { st_nm: stateName, district: districtName },
      }) => {
        console.log('🗺️ Warehouse map feature clicked:', { stateName, district: districtName });

        if (stateCode === USA_STATE_CODE && stateName) {
          let targetStateCode = getStateCodeFromName(stateName);
          
          if (!targetStateCode && data[stateName]) {
            const stateEntries = Object.entries(STATE_NAMES);
            const foundEntry = stateEntries.find(([code, name]) => 
              name.toUpperCase() === stateName.toUpperCase()
            );
            targetStateCode = foundEntry?.[0];
          }

          console.log('🗺️ Warehouse map state lookup:', {
            originalName: stateName,
            targetStateCode,
            hasData: !!data[stateName]
          });

          if (targetStateCode && targetStateCode !== USA_STATE_CODE && data[stateName]) {
            console.log('🗺️ Navigating to warehouse state:', targetStateCode);
            goTo({ stateCode: targetStateCode }, '/warehouse');
          } else {
            console.warn('🗺️ State code not found or no warehouse data for:', stateName);
          }
        }
      },
      tooltip: ({
        feature: {
          properties: { st_nm: stateName, district: districtName },
        },
      }) => {
        const id =
          stateCode === USA_STATE_CODE
            ? stateName
            : `${stateName}-${districtName}`.toUpperCase();
        return (
          <TableTooltip
            title={
              <>
                <b>{stateCode === USA_STATE_CODE ? stateName : districtName}</b>
              </>
            }
            rows={
              data[id]
                ? [
                    ['Type', 'Capacity', 'Count'],
                    ...data[id].warehouses.map(({ type, capacity, count }) => [
                      type,
                      readableNumber(capacity),
                      count,
                    ]),
                  ]
                : [['', 'No warehouses', '']]
            }
          />
        );
      },
    };
  }, [values, stateCode, goTo, theme.palette.primary.main]);

  return (
    <AnimatedEnter>
      {/* UPDATED CONTAINER WITH DYNAMIC PADDING AND SPACING */}
      <Box
        ref={mapRef}
        style={{ 
          width: '100%', 
          height: isUSMap ? mapHeight * 0.75 : mapHeight, // Reduce height for US map
          padding: isUSMap ? '2px' : '18px', // Minimal padding for US map
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          marginTop: isUSMap ? '-10px' : '0px', // Pull US map up
        }}>
        <ResponsiveGeoMap
          fitProjection
          isInteractive
          borderWidth={2}
          borderColor="#404040"
          features={features}
          // UPDATED PROJECTION SETTINGS FOR US MAP
          projectionType={isUSMap ? 'albersUsa' : 'mercator'}
          projectionScale={isUSMap ? 1200 : 100}
          projectionTranslation={[0.5, isUSMap ? 0.35 : 0.5]} // Move US map up more
          {...mapProps}
        />
      </Box>
      <Disclaimer />
    </AnimatedEnter>
  );
});
export default WarehouseMap;