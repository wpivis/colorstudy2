import { useEffect, useMemo, useState } from 'react';
import { Box, Radio, Stack, Text } from '@mantine/core';
import { StimulusParams } from '../../../store/types';

type ColorVisionSurveyProps = StimulusParams<{
  taskid: string; // should match reactive response id in config (e.g., "colorVisionSurveyResponse")
}>;

export default function ColorVisionSurvey({ parameters, setAnswer }: ColorVisionSurveyProps) {
  const { taskid } = parameters;

  const [colorDifficulty, setColorDifficulty] = useState<string>('');
  const [colorBlind, setColorBlind] = useState<string>('');
  const [device, setDevice] = useState<string>('');

  const isComplete = useMemo(
    () => !!colorDifficulty && !!colorBlind && !!device,
    [colorDifficulty, colorBlind, device]
  );

  useEffect(() => {
    if (!isComplete) {
      setAnswer({
        status: false,
        answers: {
          [taskid]: JSON.stringify({
            timestamp: new Date().toISOString(),
          }),
        },
      });
      return;
    }

    const payload = {
      colorDifficulty,
      colorBlind,
      device,
      timestamp: new Date().toISOString(),
    };

    setAnswer({
      status: true,
      answers: {
        [taskid]: JSON.stringify(payload),
      },
    });
  }, [isComplete, colorDifficulty, colorBlind, device, taskid, setAnswer]);

  return (
    <Stack gap="md" p="md" align="center">
      <Box style={{ maxWidth: 900, width: '100%' }}>
        <Stack gap="md">
          <Text fw={600} size="lg" ta="center">
            Final questions
          </Text>

          <Radio.Group
            value={colorDifficulty}
            onChange={setColorDifficulty}
            label="Do you have difficulty seeing colors or noticing differences between colors compared to the average person?"
            withAsterisk
          >
            <Stack mt="xs" gap="xs">
              <Radio value="Yes" label="Yes" />
              <Radio value="No" label="No" />
            </Stack>
          </Radio.Group>

          <Radio.Group
            value={colorBlind}
            onChange={setColorBlind}
            label="Do you consider yourself to be colorblind?"
            withAsterisk
          >
            <Stack mt="xs" gap="xs">
              <Radio value="Yes" label="Yes" />
              <Radio value="No" label="No" />
            </Stack>
          </Radio.Group>

          <Radio.Group
            value={device}
            onChange={setDevice}
            label="What device did you use to complete this experiment?"
            withAsterisk
          >
            <Stack mt="xs" gap="xs">
              <Radio value="Computer" label="Computer" />
              <Radio value="Tablet" label="Tablet" />
              <Radio value="Phone" label="Phone" />
              <Radio value="Other" label="Other" />
            </Stack>
          </Radio.Group>

          {!isComplete && (
            <Text size="sm" c="dimmed" ta="center" mt="sm">
              Please answer all questions to continue.
            </Text>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}