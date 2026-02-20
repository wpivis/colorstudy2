import { useEffect, useMemo, useState } from 'react';
import {
  Box, Group, Image, Stack, Text, TextInput,
} from '@mantine/core';
import { StimulusParams } from '../../../store/types';

// Auto-import all Ishihara images inside ./ishihara
const ishiharaImages = import.meta.glob('./ishihara/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

function getIshiharaUrl(plateIndex: number) {
  const needle = `/ishihara-${plateIndex}.png`;
  const matchKey = Object.keys(ishiharaImages).find((k) => k.endsWith(needle));
  return matchKey ? ishiharaImages[matchKey] : undefined;
}

type IshiharaPlateProps = StimulusParams<{
  taskid: string; // should match the reactive response id in config (e.g., "ishiharaResponse")
  plateIndex: number; // 0..10
  correctResponse: string; // e.g., "12"
  imagePath: string; // e.g., "/color-palette-study/assets/ishihara/ishihara-0.png"
}>;

function normalizeResponse(s: string) {
  const trimmed = (s ?? '').trim();

  if (!trimmed) return '';

  // Accept only digits
  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }

  // Accept only "none" (any case)
  if (/^none$/i.test(trimmed)) {
    return 'none';
  }

  // Everything else is invalid
  return '';
}

export default function IshiharaPlate({ parameters, setAnswer }: IshiharaPlateProps) {
  const {
    taskid, plateIndex, correctResponse, imagePath,
  } = parameters;

  const [rawInput, setRawInput] = useState<string>('');
  const [hasTyped, setHasTyped] = useState<boolean>(false);

  const normalized = useMemo(() => normalizeResponse(rawInput), [rawInput]);
  const normalizedCorrect = useMemo(() => normalizeResponse(correctResponse), [correctResponse]);

  // For triggering shake animation on incorrect response
  const [shake, setShake] = useState(false);
  const isValid = normalized.length > 0;
  const [attemptedProceed, setAttemptedProceed] = useState(false);
  const triggerShake = () => {
    setShake(true);
    window.setTimeout(() => setShake(false), 350);
  };

  const isComplete = useMemo(() => normalized.length > 0, [normalized]);

  const isCorrect = useMemo(() => {
    if (!isComplete) return null;
    // If participant types "none", treat as literal none.
    return normalized === normalizedCorrect;
  }, [isComplete, normalized, normalizedCorrect]);

  // Disable Next until they provide a response; once provided, save payload
  useEffect(() => {
    if (!isComplete) {
      setAnswer({
        status: false,
        answers: {
          [taskid]: JSON.stringify({
            plateIndex,
            imagePath,
            timestamp: new Date().toISOString(),
          }),
        },
      });
      return;
    }

    const payload = {
      plateIndex,
      imagePath,
      responseRaw: rawInput,
      responseNormalized: normalized,
      correctResponse,
      correctNormalized: normalizedCorrect,
      isCorrect,
      timestamp: new Date().toISOString(),
    };

    setAnswer({
      status: true,
      answers: {
        [taskid]: JSON.stringify(payload),
      },
    });
  }, [
    isComplete,
    taskid,
    plateIndex,
    imagePath,
    rawInput,
    normalized,
    correctResponse,
    normalizedCorrect,
    isCorrect,
    setAnswer,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isSpace = e.code === 'Space';
      const isEnter = e.code === 'Enter' || e.key === 'Enter';

      if (!isSpace && !isEnter) return;

      // prevent page scroll on Space and prevent default Enter behavior
      e.preventDefault();

      if (!isValid) {
        setAttemptedProceed(true);
        triggerShake();
        return;
      }

      // If valid, allow your normal "advance" behavior.
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        bubbles: true,
      });
      document.dispatchEvent(enterEvent);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isValid]);

  const resolvedSrc = getIshiharaUrl(plateIndex);

  return (
    <Stack gap="md" p="md" align="center">
      <Box style={{ maxWidth: 900, width: '100%' }}>
        <Stack gap="sm" align="center">
          <Text ta="center" style={{ maxWidth: 620 }}>
            Carefully type the number you see using digits (e.g., type &ldquo;100&rdquo; not &ldquo;one hundred&rdquo;).
            If you do not see a number, type
            {' '}
            <strong>&ldquo;None&rdquo;</strong>
            .
          </Text>

          <Box
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              marginTop: 6,
            }}
          >
            <Image
              src={resolvedSrc}
              alt={`Ishihara plate ${plateIndex}`}
              fit="contain"
              style={{
                maxHeight: 440,
                width: '100%',
                maxWidth: 640,
              }}
            />
          </Box>

          <Group justify="center" w="100%" mt="sm">
            <TextInput
              className={shake ? 'shake' : ''}
              value={rawInput}
              onChange={(e) => {
                setRawInput(e.currentTarget.value);
                if (!hasTyped) setHasTyped(true);
                // reset warning while they edit again (optional but recommended)
                if (attemptedProceed) setAttemptedProceed(false);
              }}
              placeholder='Type a number (e.g., "12") or "None"'
              w={360}
              autoFocus
            />
          </Group>

          <Text size="sm" c={!isValid && attemptedProceed ? 'red' : 'dimmed'} ta="center" mt="xs">
            {!isValid && attemptedProceed
              ? 'Please enter a valid response (digits only or "None").'
              : 'Please enter a response to continue.'}
          </Text>

        </Stack>
      </Box>
    </Stack>
  );
}
