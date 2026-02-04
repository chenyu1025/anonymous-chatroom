// 简单的 WAV 录音实现

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  initContext() {
    // MediaRecorder doesn't need explicit context initialization
  }

  async start(): Promise<void> {
    this.chunks = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1, // 强制单声道，减小体积并提高兼容性
          echoCancellation: true, // 回声消除
          noiseSuppression: true, // 降噪
          autoGainControl: true, // 自动增益
        }
      });

      // 优先尝试 MP4 (Safari 友好，兼容性更好)，然后是 WebM (Chrome/Android 标准)
      // Safari 14.1+ 虽然支持 WebM 播放，但录制 MP4 (AAC) 对 iOS 生态更友好
      const mimeType = MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/webm;codecs=opus';

      // Set lower bitrate for faster loading (32kbps)
      const options: MediaRecorderOptions = {
        mimeType,
        audioBitsPerSecond: 32000
      };

      this.mediaRecorder = new MediaRecorder(stream, options);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      this.mediaRecorder.start(100); // Collect chunks every 100ms
    } catch (error) {
      console.error('getUserMedia error:', error);
      throw new Error('无法访问麦克风，请检查权限设置');
    }
  }

  stop(): Promise<{ blob: Blob; url: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Recorder not initialized'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        // Convert to a compatible blob type if needed, but usually the recorded blob is fine
        // For Safari compatibility, we might want to ensure we're using a supported type
        const blob = new Blob(this.chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);

        // Stop all tracks
        this.mediaRecorder?.stream.getTracks().forEach(track => track.stop());
        this.mediaRecorder = null;

        resolve({ blob, url });
      };

      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      } else {
        // If already stopped, resolve immediately
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        resolve({ blob, url });
      }
    });
  }

  // Removed exportWAV and helper methods as they are no longer needed
}
