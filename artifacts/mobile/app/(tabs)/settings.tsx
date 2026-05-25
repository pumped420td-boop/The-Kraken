import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetSettings,
  useUpdateSettings,
  useSaveKeys,
  useDeleteKeys,
  useGetKeysStatus,
  getGetSettingsQueryKey,
  getGetPortfolioQueryKey,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: settings } = useGetSettings({ query: { queryKey: getGetSettingsQueryKey() } });
  const { data: keysStatus } = useGetKeysStatus({});
  const updateSettings = useUpdateSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPortfolioQueryKey() });
      },
    },
  });
  const saveKeys = useSaveKeys({ mutation: { onSuccess: () => queryClient.invalidateQueries() } });
  const deleteKeys = useDeleteKeys({ mutation: { onSuccess: () => queryClient.invalidateQueries() } });

  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [allocation, setAllocation] = useState("50");
  const [profitTarget, setProfitTarget] = useState("5");
  const [trailingStop, setTrailingStop] = useState("2");
  const [voteThreshold, setVoteThreshold] = useState("4");
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (settings) {
      setAllocation(String(settings.allocation));
      setProfitTarget(String(settings.profitTarget));
      setTrailingStop(String(settings.trailingStop));
      setVoteThreshold(String(settings.voteThreshold));
    }
  }, [settings]);

  const handleSaveKeys = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      Alert.alert("Error", "Both API key and secret are required");
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    saveKeys.mutate({ data: { apiKey: apiKey.trim(), apiSecret: apiSecret.trim() } });
    setApiKey("");
    setApiSecret("");
  };

  const handleDeleteKeys = () => {
    Alert.alert("Remove API Keys", "This will also switch to paper trading mode.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deleteKeys.mutate({}) },
    ]);
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateSettings.mutate({
      data: {
        allocation: parseFloat(allocation) || 50,
        mode: settings?.mode ?? "paper",
        profitTarget: parseFloat(profitTarget) || 5,
        trailingStop: parseFloat(trailingStop) || 2,
        maxConcurrentTrades: settings?.maxConcurrentTrades ?? 2,
        voteThreshold: parseInt(voteThreshold) || 4,
      },
    });
    setSavingSettings(false);
  };

  const handleModeToggle = (toLive: boolean) => {
    if (toLive && !keysStatus?.configured) {
      Alert.alert("API Keys Required", "Add your Kraken API keys before switching to live mode.");
      return;
    }
    const base = {
      allocation: settings?.allocation ?? 50,
      profitTarget: settings?.profitTarget ?? 5,
      trailingStop: settings?.trailingStop ?? 2,
      maxConcurrentTrades: settings?.maxConcurrentTrades ?? 2,
      voteThreshold: settings?.voteThreshold ?? 4,
    };
    if (toLive) {
      Alert.alert(
        "Enable Live Trading",
        "This will place real orders on Kraken using your actual funds. Are you sure?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Enable Live",
            style: "destructive",
            onPress: () => updateSettings.mutate({ data: { ...base, mode: "live" } }),
          },
        ]
      );
    } else {
      updateSettings.mutate({ data: { ...base, mode: "paper" } });
    }
  };

  const isLive = settings?.mode === "live";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: Platform.OS === "web" ? 34 + 84 : 84 }]}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>

      {/* API Keys */}
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>KRAKEN API KEYS</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {keysStatus?.configured ? (
          <View style={styles.keysConfigured}>
            <View style={[styles.keysBadge, { backgroundColor: `${(colors as any).success}22` }]}>
              <Feather name="check-circle" size={16} color={(colors as any).success} />
              <Text style={[styles.keysBadgeText, { color: (colors as any).success }]}>API Keys Configured</Text>
            </View>
            <TouchableOpacity onPress={handleDeleteKeys} style={[styles.removeBtn, { borderColor: colors.destructive }]}>
              <Feather name="trash-2" size={14} color={colors.destructive} />
              <Text style={[styles.removeBtnText, { color: colors.destructive }]}>Remove Keys</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={[styles.cardNote, { color: colors.mutedForeground }]}>
              Keys are stored in memory only and never sent outside your server.
            </Text>
            <View style={[styles.inputGroup, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="key" size={14} color={colors.mutedForeground} />
              <TextInput
                placeholder="API Key"
                placeholderTextColor={colors.mutedForeground}
                value={apiKey}
                onChangeText={setApiKey}
                secureTextEntry={!showKey}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
              />
              <TouchableOpacity onPress={() => setShowKey(!showKey)}>
                <Feather name={showKey ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <View style={[styles.inputGroup, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="lock" size={14} color={colors.mutedForeground} />
              <TextInput
                placeholder="API Secret"
                placeholderTextColor={colors.mutedForeground}
                value={apiSecret}
                onChangeText={setApiSecret}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
              />
            </View>
            <TouchableOpacity
              onPress={handleSaveKeys}
              disabled={saveKeys.isPending}
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            >
              {saveKeys.isPending ? (
                <ActivityIndicator color={colors.primaryForeground} size="small" />
              ) : (
                <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save Keys</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Trading Mode */}
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>TRADING MODE</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.modeRow}>
          <View style={styles.modeInfo}>
            <Text style={[styles.modeTitle, { color: colors.foreground }]}>
              {isLive ? "Live Trading" : "Paper Trading"}
            </Text>
            <Text style={[styles.modeSub, { color: colors.mutedForeground }]}>
              {isLive
                ? "Real orders on Kraken with real funds"
                : "Simulated trades with $10,000 virtual balance"}
            </Text>
          </View>
          <Switch
            value={isLive}
            onValueChange={handleModeToggle}
            trackColor={{ false: colors.secondary, true: `${colors.destructive}88` }}
            thumbColor={isLive ? colors.destructive : colors.mutedForeground}
          />
        </View>
        {isLive && (
          <View style={[styles.warningBanner, { backgroundColor: `${colors.destructive}22` }]}>
            <Feather name="alert-triangle" size={14} color={colors.destructive} />
            <Text style={[styles.warningText, { color: colors.destructive }]}>
              Live mode uses real funds. Bot will place actual Kraken orders.
            </Text>
          </View>
        )}
      </View>

      {/* Bot Parameters */}
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>BOT PARAMETERS</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

        <SettingRow
          label="Balance Allocation"
          desc="% of USD balance to use for trading"
          value={allocation}
          onChangeText={setAllocation}
          unit="%"
          colors={colors}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingRow
          label="Profit Target"
          desc="Minimum profit before trailing stop activates"
          value={profitTarget}
          onChangeText={setProfitTarget}
          unit="%"
          colors={colors}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingRow
          label="Trailing Stop Loss"
          desc="Close trade if price drops this % from peak"
          value={trailingStop}
          onChangeText={setTrailingStop}
          unit="%"
          colors={colors}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingRow
          label="Vote Threshold"
          desc="Min strategy buy votes to open a trade (max 7)"
          value={voteThreshold}
          onChangeText={setVoteThreshold}
          unit="/7"
          colors={colors}
        />

        <TouchableOpacity
          onPress={handleSaveSettings}
          disabled={updateSettings.isPending}
          style={[styles.saveBtn, { backgroundColor: colors.primary, marginTop: 16 }]}
        >
          {updateSettings.isPending ? (
            <ActivityIndicator color={colors.primaryForeground} size="small" />
          ) : (
            <>
              <Feather name="check" size={16} color={colors.primaryForeground} />
              <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save Settings</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* How it works */}
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>HOW IT WORKS</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[
          { icon: "activity" as const, title: "7 Simultaneous Strategies", desc: "RSI, MACD, Bollinger, EMA, VWAP, Momentum, and ML Pattern all run at once" },
          { icon: "check-square" as const, title: "Weighted Voting", desc: `A trade opens when ${settings?.voteThreshold ?? 4}+ strategies vote BUY with weighted confidence` },
          { icon: "trending-up" as const, title: "Smart Profit Taking", desc: `Takes profit at ${settings?.profitTarget ?? 5}% minimum, then trails with a ${settings?.trailingStop ?? 2}% stop` },
          { icon: "cpu" as const, title: "Continuous Learning", desc: "Strategy weights auto-adjust based on historical win rates per coin" },
        ].map((item, i) => (
          <View key={i} style={[styles.howItem, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={[styles.howIcon, { backgroundColor: colors.accent }]}>
              <Feather name={item.icon} size={16} color={colors.primary} />
            </View>
            <View style={styles.howText}>
              <Text style={[styles.howTitle, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[styles.howDesc, { color: colors.mutedForeground }]}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function SettingRow({
  label,
  desc,
  value,
  onChangeText,
  unit,
  colors,
}: {
  label: string;
  desc: string;
  value: string;
  onChangeText: (v: string) => void;
  unit: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, { color: colors.foreground }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.settingDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
          {desc}
        </Text>
      </View>
      <View style={[styles.settingInput, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          style={[styles.settingInputText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}
        />
        <Text style={[styles.settingUnit, { color: colors.mutedForeground }]}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20 },
  cardNote: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 14, lineHeight: 18 },
  keysConfigured: { gap: 12 },
  keysBadge: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10 },
  keysBadgeText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  removeBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignSelf: "flex-start" },
  removeBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  inputGroup: { flexDirection: "row", alignItems: "center", borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 10, marginBottom: 10 },
  input: { flex: 1, fontSize: 15 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 12, paddingVertical: 14, gap: 8 },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  modeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  modeInfo: { flex: 1, minWidth: 0 },
  modeTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  modeSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3, lineHeight: 18 },
  warningBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 8, padding: 10, marginTop: 14 },
  warningText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium", lineHeight: 18 },
  settingRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  settingInfo: { flex: 1, minWidth: 0, marginRight: 12 },
  settingLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  settingDesc: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 3, lineHeight: 16 },
  settingInput: { flexDirection: "row", alignItems: "center", borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8, width: 76, flexShrink: 0 },
  settingInputText: { fontSize: 16, textAlign: "center", flex: 1 },
  settingUnit: { fontSize: 12, fontFamily: "Inter_400Regular" },
  divider: { height: 1 },
  howItem: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 14 },
  howIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  howText: { flex: 1, minWidth: 0 },
  howTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  howDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3, lineHeight: 18 },
});
