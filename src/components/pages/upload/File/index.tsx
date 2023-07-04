import {
  ActionIcon,
  Button,
  Collapse,
  Grid,
  Group,
  Progress,
  Text,
  Title,
  Tooltip,
  rem,
  useMantineTheme,
} from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { useClipboard } from '@mantine/hooks';
import { useModals } from '@mantine/modals';
import { IconFiles, IconPhoto, IconUpload, IconX } from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';
import { uploadFiles } from '../uploadFiles';
import ToUploadFile from './ToUploadFile';

export default function UploadFile() {
  const theme = useMantineTheme();
  const modals = useModals();
  const clipboard = useClipboard();

  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [dropLoading, setLoading] = useState(false);

  const upload = () => {
    uploadFiles(files, {
      setFiles,
      setLoading,
      setProgress,
      modals,
      clipboard,
    });
  };

  return (
    <>
      <Group spacing='sm'>
        <Title order={1}>Upload files</Title>

        <Tooltip label='View your files'>
          <ActionIcon component={Link} href='/dashboard/files' variant='outline' color='gray' radius='sm'>
            <IconFiles size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Dropzone onDrop={(f) => setFiles([...f, ...files])} my='sm' loading={dropLoading}>
        <Group position='center' spacing='xl' style={{ minHeight: rem(220), pointerEvents: 'none' }}>
          <Dropzone.Accept>
            <IconUpload
              size='3.2rem'
              stroke={1.5}
              color={theme.colors[theme.primaryColor][theme.colorScheme === 'dark' ? 4 : 6]}
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX
              size='3.2rem'
              stroke={1.5}
              color={theme.colors.red[theme.colorScheme === 'dark' ? 4 : 6]}
            />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconPhoto size='3.2rem' stroke={1.5} />
          </Dropzone.Idle>

          <div>
            <Text size='xl' inline>
              Drag images here or click to select files
            </Text>
            <Text size='sm' color='dimmed' inline mt={7}>
              Attach as many files as you like, they will show up below to review before uploading.
            </Text>
          </div>
        </Group>
      </Dropzone>

      <Collapse in={progress !== 0}>
        {progress !== 0 && <Progress my='sm' label={`${Math.floor(progress)}%`} value={progress} animate />}
      </Collapse>

      <Grid grow my='sm'>
        {files.map((file, i) => (
          <Grid.Col span={3} key={i}>
            <ToUploadFile file={file} onDelete={() => setFiles(files.filter((_, j) => i !== j))} />
          </Grid.Col>
        ))}
      </Grid>

      <Button
        variant='outline'
        color='gray'
        leftIcon={<IconUpload size={18} />}
        disabled={files.length === 0 || dropLoading}
        fullWidth
        size='xl'
        onClick={upload}
      >
        Upload {files.length} files
      </Button>
    </>
  );
}
