import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { Button, Notice, styles } from "./ui";
const pauseOthers = new Set<() => void>();
export function Audio({
  url,
  refresh,
}: {
  url: string | null | undefined;
  refresh: () => Promise<string | null | undefined>;
}) {
  const player = useAudioPlayer(url || null),
    state = useAudioPlayerStatus(player),
    position = useRef<number | null>(null);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [rate, setRate] = useState(1);
  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: "doNotMix",
    }).catch((e) => setError(e.message));
  }, []);
  useFocusEffect(
    useCallback(() => {
      const pause = () => {
        try {
          player.pause();
        } catch {
          /* The native player may already be released during unmount. */
        }
      };
      pauseOthers.add(pause);
      const subscription = AppState.addEventListener("change", (value) => {
        if (value !== "active") pause();
      });
      return () => {
        pause();
        pauseOthers.delete(pause);
        subscription.remove();
      };
    }, [player]),
  );
  useEffect(() => {
    if (state.isLoaded && position.current !== null) {
      const time = position.current;
      position.current = null;
      void player
        .seekTo(Math.min(time, state.duration))
        .catch((e) => setError(e.message));
      player.setPlaybackRate(rate);
    }
  }, [state.isLoaded, state.duration, player, rate]);
  async function reload() {
    setBusy(true);
    setError("");
    position.current = state.currentTime;
    try {
      const next = await refresh();
      if (!next) throw new Error("Audio hiện chưa khả dụng.");
      player.replace(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function play() {
    try {
      if (state.playing) player.pause();
      else {
        pauseOthers.forEach((p) => p());
        if (state.didJustFinish)
          void player.seekTo(0).catch((e) => setError(e.message));
        player.play();
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.eyebrow}>NGHE & KHÁM PHÁ</Text>
      <Notice>
        {error || state.error || (!url ? "Audio chưa khả dụng." : "")}
      </Notice>
      <View style={styles.row}>
        <Button
          title={state.playing ? "Tạm dừng" : "Phát audio"}
          disabled={!state.isLoaded || busy}
          onPress={play}
        />
        <Text style={styles.small}>
          {Math.floor(state.currentTime || 0)} /{" "}
          {Math.floor(state.duration || 0)} giây
        </Text>
      </View>
      <View style={styles.row}>
        <Button
          secondary
          title="−10 giây"
          disabled={!state.isLoaded}
          onPress={() =>
            void player.seekTo(Math.max(0, state.currentTime - 10))
          }
        />
        <Button
          secondary
          title="+10 giây"
          disabled={!state.isLoaded}
          onPress={() =>
            void player.seekTo(Math.min(state.duration, state.currentTime + 10))
          }
        />
        {[0.75, 1, 1.25].map((value) => (
          <Button
            key={value}
            secondary={rate !== value}
            title={`${value}×`}
            disabled={!state.isLoaded}
            onPress={() => {
              setRate(value);
              player.setPlaybackRate(value);
            }}
          />
        ))}
      </View>
      <Button
        secondary
        title={busy ? "Đang tải audio…" : "Tải lại audio"}
        disabled={busy}
        onPress={() => void reload()}
      />
    </View>
  );
}
