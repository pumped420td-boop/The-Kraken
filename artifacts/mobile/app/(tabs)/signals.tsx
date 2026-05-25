import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  useGetStrategies,
  useGetVotes,
  getGetStrategiesQueryKey,
  getGetVotesQueryKey,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

export default function SignalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"strategies" | "votes">("strategies");
  const [refreshing, setRefreshing] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: stratData, isLoading: stratLoading, refetch: refetchStrat } = useGetStrategies({
    query: { refetchInterval: 15000, queryKey: getGetStrategiesQueryKey() },
  });
  const { data: voteData, isLoading: voteLoading, refetch: refetchVotes } = useGetVotes({
    query: { refetchInterval: 15000, queryKey: getGetVotesQueryKey() },
    enabled: tab === "votes",
  } as any);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStrat(), tab === "votes" ? refetchVotes() : Promise.resolve()]);
    setRefreshing(false);
  };

  const strategies = stratData?.strategies ?? [];
  const votes = (voteData?.results ?? []).sort((a, b) => b.confidence - a.confidence);
  const buySignals = votes.filter((v) => v.decision === "buy");
  const topBuys = buySignals.slice(0, 10);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: Platform.OS === "web" ? 34 + 84 : 84 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Signals</Text>

      {/* Tab switcher */}
      <View style={[styles.tabRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setTab("strategies")}
          style={[styles.tabButton, tab === "strategies" && { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.tabText, { color: tab === "strategies" ? colors.primaryForeground : colors.mutedForeground }]}>
            Strategies
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab("votes")}
          style={[styles.tabButton, tab === "votes" && { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.tabText, { color: tab === "votes" ? colors.primaryForeground : colors.mutedForeground }]}>
            Live Votes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Strategy weights */}
      {tab === "strategies" && (
        <>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="cpu" size={16} color={colors.primary} />
            <View style={styles.infoText}>
              <Text style={[styles.infoTitle, { color: colors.foreground }]}>Learning Engine</Text>
              <Text style={[styles.infoSub, { color: colors.mutedForeground }]}>
                {stratData?.learningCycles ?? 0} learning cycles · weights auto-adjust from outcomes
              </Text>
            </View>
          </View>

          {stratLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : (
            strategies.map((strategy) => {
              const winRate = strategy.winRate;
              const weightPct = Math.min(100, (strategy.weight / 2.5) * 100);
              const signalColor = strategy.currentSignal === "buy" ? colors.success
                : strategy.currentSignal === "sell" ? colors.destructive
                : colors.mutedForeground;

              return (
                <View key={strategy.id} style={[styles.stratCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.stratHeader}>
                    <View style={styles.stratLeft}>
                      <Text style={[styles.stratName, { color: colors.foreground }]}>{strategy.name}</Text>
                      <Text style={[styles.stratDesc, { color: colors.mutedForeground }]}>{strategy.description}</Text>
                    </View>
                    <View style={[styles.signalBadge, { backgroundColor: `${signalColor}22` }]}>
                      <Text style={[styles.signalText, { color: signalColor }]}>
                        {strategy.currentSignal.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.stratStats}>
                    <View style={styles.stratStat}>
                      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Weight</Text>
                      <Text style={[styles.statVal, { color: colors.primary }]}>{strategy.weight.toFixed(2)}x</Text>
                    </View>
                    <View style={styles.stratStat}>
                      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Win Rate</Text>
                      <Text style={[styles.statVal, { color: colors.foreground }]}>{winRate.toFixed(1)}%</Text>
                    </View>
                    <View style={styles.stratStat}>
                      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Signals</Text>
                      <Text style={[styles.statVal, { color: colors.foreground }]}>{strategy.totalSignals}</Text>
                    </View>
                  </View>

                  <View style={[styles.weightBar, { backgroundColor: colors.secondary }]}>
                    <View style={[styles.weightFill, { width: `${weightPct}%` as any, backgroundColor: colors.primary }]} />
                  </View>
                </View>
              );
            })
          )}
        </>
      )}

      {/* Live votes */}
      {tab === "votes" && (
        <>
          {voteLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : votes.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="alert-circle" size={24} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No data yet</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Start the bot to load market data</Text>
            </View>
          ) : (
            <>
              <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="trending-up" size={16} color={colors.success} />
                <Text style={[styles.infoTitle, { color: colors.foreground }]}>
                  {buySignals.length} buy signals from {votes.length} coins
                </Text>
              </View>
              {votes.slice(0, 20).map((vote) => {
                const total = vote.buyScore + vote.sellScore + vote.holdScore;
                const buyPct = total > 0 ? (vote.buyScore / total) * 100 : 33;
                const sellPct = total > 0 ? (vote.sellScore / total) * 100 : 33;
                const decisionColor = vote.decision === "buy" ? colors.success
                  : vote.decision === "sell" ? colors.destructive
                  : colors.mutedForeground;

                return (
                  <View key={vote.symbol} style={[styles.voteCard, { backgroundColor: colors.card, borderColor: vote.decision === "buy" ? `${colors.success}44` : colors.border }]}>
                    <View style={styles.voteHeader}>
                      <View>
                        <Text style={[styles.voteSymbol, { color: colors.foreground }]}>{vote.symbol}</Text>
                        <Text style={[styles.voteName, { color: colors.mutedForeground }]}>{vote.name}</Text>
                      </View>
                      <View style={styles.voteRight}>
                        <Text style={[styles.voteDecision, { color: decisionColor }]}>{vote.decision.toUpperCase()}</Text>
                        <Text style={[styles.voteConfidence, { color: colors.mutedForeground }]}>
                          {(vote.confidence * 100).toFixed(0)}% conf
                        </Text>
                      </View>
                    </View>
                    {/* Vote breakdown bar */}
                    <View style={styles.voteBarRow}>
                      <View style={[styles.voteBar, { backgroundColor: colors.secondary }]}>
                        <View style={[styles.buyBar, { width: `${buyPct}%` as any, backgroundColor: colors.success }]} />
                        <View style={[styles.sellBar, { width: `${sellPct}%` as any, backgroundColor: colors.destructive }]} />
                      </View>
                      <Text style={[styles.voteCount, { color: colors.mutedForeground }]}>
                        {vote.votes.filter((v) => v.vote === "buy").length}/7 buy
                      </Text>
                    </View>
                    {/* Strategy breakdown */}
                    <View style={styles.stratBreakdown}>
                      {vote.votes.map((v) => (
                        <View key={v.strategyId} style={[styles.stratVoteDot, {
                          backgroundColor: v.vote === "buy" ? colors.success : v.vote === "sell" ? colors.destructive : colors.secondary
                        }]}>
                          <Text style={[styles.stratVoteLabel, { color: v.vote === "hold" ? colors.mutedForeground : "#000" }]}>
                            {v.strategyName.slice(0, 3).toUpperCase()}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 16 },
  tabRow: { flexDirection: "row", borderRadius: 12, borderWidth: 1, padding: 4, marginBottom: 16, gap: 4 },
  tabButton: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  infoCard: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 14 },
  infoText: { flex: 1 },
  infoTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  infoSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  stratCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 10 },
  stratHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  stratLeft: { flex: 1, marginRight: 10 },
  stratName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  stratDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3, lineHeight: 16 },
  signalBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  signalText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  stratStats: { flexDirection: "row", marginBottom: 12 },
  stratStat: { flex: 1, alignItems: "center" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 3 },
  statVal: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  weightBar: { height: 4, borderRadius: 2, overflow: "hidden" },
  weightFill: { height: "100%", borderRadius: 2 },
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  voteCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8 },
  voteHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  voteSymbol: { fontSize: 15, fontFamily: "Inter_700Bold" },
  voteName: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  voteRight: { alignItems: "flex-end" },
  voteDecision: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  voteConfidence: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  voteBarRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  voteBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden", flexDirection: "row" },
  buyBar: { height: "100%" },
  sellBar: { height: "100%" },
  voteCount: { fontSize: 11, fontFamily: "Inter_500Medium", width: 50, textAlign: "right" },
  stratBreakdown: { flexDirection: "row", gap: 5, flexWrap: "wrap" },
  stratVoteDot: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  stratVoteLabel: { fontSize: 9, fontFamily: "Inter_700Bold" },
});
