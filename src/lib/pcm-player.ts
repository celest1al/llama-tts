export type PCMPlayerOption = {
  encoding?: "8bitInt" | "16bitInt" | "32bitInt" | "32bitFloat";
  channels?: number;
  sampleRate?: number;
  flushingTime?: number;
};

export class PCMPlayer {
  private option: PCMPlayerOption;
  private samples: Float32Array | null;
  private interval: NodeJS.Timeout;
  private maxValue: number;
  private typedArray: new (buffer: ArrayBuffer) =>
    | Int8Array
    | Int16Array
    | Int32Array
    | Float32Array;
  private audioCtx: AudioContext;
  private gainNode: GainNode;
  private startTime: number;

  constructor(option: PCMPlayerOption) {
    const defaults: PCMPlayerOption = {
        encoding: "16bitInt",
        channels: 1,
        sampleRate: 8000,
        flushingTime: 1000,
      };
      this.option = Object.assign({}, defaults, option);
      this.samples = new Float32Array();
      this.flush = this.flush.bind(this);
      this.interval = setInterval(this.flush, this.option.flushingTime);
      this.maxValue = this.getMaxValue();
      this.typedArray = this.getTypedArray();
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

      // context needs to be resumed on iOS and Safari (or it will stay in "suspended" state)
      this.audioCtx.resume();
      this.audioCtx.onstatechange = () => console.log(this.audioCtx.state); // if you want to see "Running" state in console and be happy about it
  
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = 1;
      this.gainNode.connect(this.audioCtx.destination);
      this.startTime = this.audioCtx.currentTime;
  }

  private getMaxValue(): number {
    const encodings: { [key: string]: number } = {
      "8bitInt": 128,
      "16bitInt": 32768,
      "32bitInt": 2147483648,
      "32bitFloat": 1,
    };

    return (
      encodings[this.option.encoding || "16bitInt"] || encodings["16bitInt"]
    );
  }

  private getTypedArray(): new (buffer: ArrayBuffer) =>
    | Int8Array
    | Int16Array
    | Int32Array
    | Float32Array {
    const typedArrays: {
      [key: string]: new (buffer: ArrayBuffer) =>
        | Int8Array
        | Int16Array
        | Int32Array
        | Float32Array;
    } = {
      "8bitInt": Int8Array,
      "16bitInt": Int16Array,
      "32bitInt": Int32Array,
      "32bitFloat": Float32Array,
    };

    return (
      typedArrays[this.option.encoding || "16bitInt"] || typedArrays["16bitInt"]
    );
  }

  private isTypedArray(data: any) {
    return (
      data.byteLength && data.buffer && data.buffer.constructor === ArrayBuffer
    );
  }

  public feed(data: any) {
    if (!this.isTypedArray(data)) return;
    data = this.getFormatedValue(data);
    const tmp = new Float32Array(this?.samples?.length + data.length);
    tmp.set(this?.samples as Float32Array, 0);
    tmp.set(data, this.samples?.length);
    this.samples = tmp;
  }

  private getFormatedValue(data: any): Float32Array {
    const typedData = new this.typedArray(
      data instanceof ArrayBuffer ? data : data.buffer
    );
    const float32 = new Float32Array(typedData.length);

    for (let i = 0; i < typedData.length; i++) {
      float32[i] = typedData[i] / this.maxValue;
    }
    return float32;
  }

  public volume(volume: number) {
    this.gainNode.gain.value = volume;
  }

  public destroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.samples = null;
    this.audioCtx.close();
    // @ts-ignore
    this.audioCtx = null;
  }

  private flush() {
    if (!this?.samples?.length) return;
    const bufferSource = this.audioCtx.createBufferSource();
    const length = this.samples.length / (this.option.channels || 1);
    const audioBuffer = this.audioCtx.createBuffer(
      this.option.channels || 1,
      length,
      this.option.sampleRate || 8000
    );
    let audioData;
    let channel;
    let offset;
    let i;
    let decrement;

    for (channel = 0; channel < (this.option.channels || 1); channel++) {
      audioData = audioBuffer.getChannelData(channel);
      offset = channel;
      decrement = 50;
      for (i = 0; i < length; i++) {
        audioData[i] = this.samples[offset];
        /* fadein */
        if (i < 50) {
          audioData[i] = (audioData[i] * i) / 50;
        }
        /* fadeout*/
        if (i >= length - 51) {
          audioData[i] = (audioData[i] * decrement--) / 50;
        }
        offset += this.option.channels || 1;
      }
    }

    if (this.startTime < this.audioCtx.currentTime) {
      this.startTime = this.audioCtx.currentTime;
    }
    console.log(
      "start vs current " +
        this.startTime +
        " vs " +
        this.audioCtx.currentTime +
        " duration: " +
        audioBuffer.duration
    );
    bufferSource.buffer = audioBuffer;
    bufferSource.connect(this.gainNode);
    bufferSource.start(this.startTime);
    this.startTime += audioBuffer.duration;
    this.samples = new Float32Array();
  }
}
