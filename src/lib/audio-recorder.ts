// 简单的 WAV 录音实现

export class AudioRecorder {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private mediaNode: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private chunks: Float32Array[] = [];
  private recording: boolean = false;
  private sampleRate: number = 44100;

  async start(): Promise<void> {
    this.chunks = [];
    this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    this.sampleRate = this.audioContext.sampleRate;
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

    // 使用 ScriptProcessorNode 获取原始音频数据 (虽然已废弃但兼容性好)
    // bufferSize: 4096, inputChannels: 1, outputChannels: 1
    this.mediaNode = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.mediaNode.onaudioprocess = (e) => {
      if (!this.recording) return;
      const input = e.inputBuffer.getChannelData(0);
      // 克隆数据，因为 inputBuffer 会被重用
      this.chunks.push(new Float32Array(input));
    };

    this.sourceNode.connect(this.mediaNode);
    this.mediaNode.connect(this.audioContext.destination);

    this.recording = true;
  }

  stop(): Promise<{ blob: Blob; url: string }> {
    return new Promise((resolve) => {
      this.recording = false;

      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }

      if (this.mediaNode && this.sourceNode) {
        this.sourceNode.disconnect();
        this.mediaNode.disconnect();
      }

      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }

      // 合并数据并转换为 WAV
      const blob = this.exportWAV(this.chunks);
      const url = URL.createObjectURL(blob);

      resolve({ blob, url });
    });
  }

  private exportWAV(buffers: Float32Array[]): Blob {
    const bufferLength = buffers.reduce((acc, curr) => acc + curr.length, 0);
    const wavBuffer = new ArrayBuffer(44 + bufferLength * 2);
    const view = new DataView(wavBuffer);

    // 写入 WAV 头
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    const sampleRate = this.sampleRate;

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + bufferLength * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, bufferLength * 2, true);

    // 写入 PCM 数据
    let offset = 44;
    for (const buffer of buffers) {
      for (let i = 0; i < buffer.length; i++) {
        let s = Math.max(-1, Math.min(1, buffer[i]));
        s = s < 0 ? s * 0x8000 : s * 0x7FFF;
        view.setInt16(offset, s, true);
        offset += 2;
      }
    }

    return new Blob([view], { type: 'audio/wav' });
  }
}
