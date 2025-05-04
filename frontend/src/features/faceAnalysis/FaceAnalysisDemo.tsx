import React, { useRef, useEffect, useState } from 'react';
import { FaceApiService, FaceApiResult, Emotion } from 'features/faceAnalysis/faceApi';
import { FaceMeshService, FaceMeshMetrics } from 'features/faceAnalysis/faceMesh';

export default function FaceAnalysisDemo() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [emotionResult, setEmotionResult] = useState<FaceApiResult | null>(null);
    const [meshMetrics, setMeshMetrics] = useState<FaceMeshMetrics | null>(null);

    useEffect(() => {
        async function init() {
            if (!videoRef.current) return;

            // 1) face-api 모델 로드
            await FaceApiService.loadModels('/models');

            // 2) 비디오 스트림 시작
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoRef.current.srcObject = stream;
            await videoRef.current.play();

            // 3) 주기적 감정 분석
            const detectLoop = async () => {
                if (videoRef.current) {
                    const res = await FaceApiService.detectExpressions(videoRef.current);
                    setEmotionResult(res);
                }
                requestAnimationFrame(detectLoop);
            };
            detectLoop();

            // 4) MediaPipe FaceMesh 지표 계산
            const meshService = new FaceMeshService(videoRef.current, metrics => {
                setMeshMetrics(metrics);
            });
            meshService.start();
        }

        init();

        // 정리(cleanup)
        return () => {
            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    return (
        <div style={{ padding: 20 }}>
            <h2>Face Analysis Demo</h2>
            <div style={{ display: 'flex', gap: 20 }}>
                <video
                    ref={videoRef}
                    style={{ width: 320, height: 240, border: '1px solid #ccc' }}
                    muted
                    playsInline
                />
                <div>
                    <h3>Expression</h3>
                    {emotionResult ? (
                        <ul>
                            <li>Top Emotion: <strong>{emotionResult.topEmotion.emotion.toUpperCase()}</strong> ({(emotionResult.topEmotion.probability * 100).toFixed(1)}%)</li>
                            {Object.entries(emotionResult.expressions).map(([emo, prob]) => (
                                <li key={emo}>{emo}: {(prob * 100).toFixed(1)}%</li>
                            ))}
                        </ul>
                    ) : (
                        <p>Detecting...</p>
                    )}
                </div>
                <div>
                    <h3>Physiological Metrics</h3>
                    {meshMetrics ? (
                        <ul>
                            <li>Blink Rate: {meshMetrics.blinkRate.toFixed(2)} /s</li>
                            <li>Micro-movements: {meshMetrics.microMovements.toFixed(4)}</li>
                            <li>Head Pose:</li>
                            <ul>
                                <li>Yaw: {meshMetrics.headPose.yaw.toFixed(1)}°</li>
                                <li>Pitch: {meshMetrics.headPose.pitch.toFixed(1)}°</li>
                                <li>Roll: {meshMetrics.headPose.roll.toFixed(1)}°</li>
                            </ul>
                        </ul>
                    ) : (
                        <p>Calculating...</p>
                    )}
                </div>
            </div>
        </div>
    );
}
