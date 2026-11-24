/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
 * Yapay zekâ modelini arayüzü dondurmadan arka planda çalıştıran işçi. */
import { WebWorkerMLCEngineHandler } from 'https://esm.run/@mlc-ai/web-llm@0.2.89';
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = msg => { handler.onmessage(msg); };
