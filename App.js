import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';

// ─── WARNA TEMA ───────────────────────────────────────────────
const COLORS = {
  bg: '#0F0F1A',
  surface: '#1A1A2E',
  surface2: '#16213E',
  border: '#2A2A4A',
  text: '#E8E8F0',
  muted: '#8888AA',
  accent: '#6C63FF',
  accent2: '#FF6584',
  done: '#43E97B',
  high: '#FF6584',
  med: '#FFB347',
  low: '#6C63FF',
};

// ─── DATA AWAL (SAMPLE) ───────────────────────────────────────
const SAMPLE_TASKS = [
  { id: '1', title: 'Beli baju pakaian musim hujan', prio: 'high', done: false, time: '08:30' },
  { id: '2', title: 'Review pull request tim', prio: 'med', done: false, time: '09:15' },
  { id: '3', title: 'Bayar tagihan internet', prio: 'high', done: true, time: '10:00' },
  { id: '4', title: 'Baca buku Flutter 30 menit', prio: 'low', done: false, time: '11:30' },
  { id: '5', title: 'Meeting project ShopList app', prio: 'med', done: false, time: '13:00' },
];

// ─── HELPER ───────────────────────────────────────────────────
const prioOrder = { high: 0, med: 1, low: 2 };
const prioLabel = { high: 'Tinggi', med: 'Sedang', low: 'Rendah' };
const prioColor = { high: COLORS.high, med: COLORS.med, low: COLORS.low };

const getNow = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// ─── KOMPONEN: STAT CARD ──────────────────────────────────────
function StatCard({ label, value, valueColor }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statNum, valueColor ? { color: valueColor } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── KOMPONEN: TASK CARD ──────────────────────────────────────
function TaskCard({ task, onToggle, onDelete }) {
  const color = prioColor[task.prio];
  return (
    <View style={[styles.taskCard, task.done && styles.taskCardDone]}>
      {/* Garis prioritas kiri */}
      <View style={[styles.prioStripe, { backgroundColor: color }]} />

      {/* Tombol centang */}
      <TouchableOpacity
        style={[styles.checkBtn, task.done && { backgroundColor: COLORS.done, borderColor: COLORS.done }]}
        onPress={() => onToggle(task.id)}
        activeOpacity={0.7}
      >
        {task.done && <Text style={styles.checkIcon}>✓</Text>}
      </TouchableOpacity>

      {/* Info task */}
      <View style={styles.taskInfo}>
        <Text
          style={[styles.taskTitle, task.done && styles.taskTitleDone]}
          numberOfLines={2}
        >
          {task.title}
        </Text>
        <View style={styles.taskMeta}>
          <View style={[styles.prioBadge, { backgroundColor: color + '25' }]}>
            <Text style={[styles.prioBadgeText, { color }]}>{prioLabel[task.prio]}</Text>
          </View>
          <Text style={styles.taskTime}>{task.time}</Text>
          {task.done && (
            <View style={[styles.prioBadge, { backgroundColor: COLORS.done + '25' }]}>
              <Text style={[styles.prioBadgeText, { color: COLORS.done }]}>✓ Selesai</Text>
            </View>
          )}
        </View>
      </View>

      {/* Tombol hapus */}
      <TouchableOpacity
        style={styles.delBtn}
        onPress={() => onDelete(task.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.delBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── KOMPONEN: EMPTY STATE ────────────────────────────────────
function EmptyState({ hasAnyTask }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🛒</Text>
      <Text style={styles.emptyTitle}>Task tidak ditemukan</Text>
      <Text style={styles.emptySub}>
        {hasAnyTask
          ? 'Tidak ada task dengan filter ini.'
          : 'Tambah task pertamamu!'}
      </Text>
    </View>
  );
}

// ─── KOMPONEN UTAMA: APP ──────────────────────────────────────
export default function App() {
  // ── STATE (P04) ──────────────────────────────────────────────
  const [tasks, setTasks] = useState(SAMPLE_TASKS);
  const [inputText, setInputText] = useState('');         // state input
  const [selectedPrio, setSelectedPrio] = useState('high');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSort, setActiveSort] = useState('default');
  const [inputError, setInputError] = useState('');

  // ── COMPUTED (useMemo untuk performa) ─────────────────────────
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Filter
    if (activeFilter === 'active') result = result.filter(t => !t.done);
    else if (activeFilter === 'done') result = result.filter(t => t.done);
    else if (['high', 'med', 'low'].includes(activeFilter))
      result = result.filter(t => t.prio === activeFilter);

    // Sort
    if (activeSort === 'priority')
      result.sort((a, b) => prioOrder[a.prio] - prioOrder[b.prio]);
    else if (activeSort === 'name')
      result.sort((a, b) => a.title.localeCompare(b.title, 'id'));

    return result;
  }, [tasks, activeFilter, activeSort]);

  const totalTask = tasks.length;
  const doneTask = tasks.filter(t => t.done).length;
  const activeTask = totalTask - doneTask;
  const pct = totalTask ? Math.round((doneTask / totalTask) * 100) : 0;

  // ── FUNGSI ADD TASK (P05 — validasi) ─────────────────────────
  const addTask = () => {
    const val = inputText.trim();
    if (!val) {
      setInputError('Task tidak boleh kosong!');
      setTimeout(() => setInputError(''), 2500);
      return;
    }
    setInputError('');
    const newTask = {
      id: Date.now().toString(),
      title: val,
      prio: selectedPrio,
      done: false,
      time: getNow(),
    };
    setTasks(prev => [newTask, ...prev]);
    setInputText('');
  };

  // ── FUNGSI TOGGLE DONE ────────────────────────────────────────
  const toggleDone = (id) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  // ── FUNGSI DELETE TASK ────────────────────────────────────────
  const deleteTask = (id) => {
    Alert.alert('Hapus Task', 'Yakin ingin menghapus task ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => setTasks(prev => prev.filter(t => t.id !== id)),
      },
    ]);
  };

  // ── RENDER ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          {/* Judul + Avatar */}
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Hey there 👋</Text>
              <Text style={styles.appName}>
                My<Text style={{ color: COLORS.accent }}>Task</Text>List
              </Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AA</Text>
            </View>
          </View>

          {/* Stats — P04 conditional rendering */}
          <View style={styles.statsRow}>
            <StatCard label="Total Task" value={totalTask} />
            <StatCard label="Selesai" value={doneTask} valueColor={COLORS.done} />
            <StatCard label="Aktif" value={activeTask} />
          </View>

          {/* Input area — P05 */}
          <View style={styles.inputArea}>
            {/* Pilih prioritas */}
            <View style={styles.prioRow}>
              {['high', 'med', 'low'].map(p => {
                const active = selectedPrio === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.prioPickBtn,
                      active && { backgroundColor: prioColor[p] + '20', borderColor: prioColor[p] },
                    ]}
                    onPress={() => setSelectedPrio(p)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.prioPickText, active && { color: prioColor[p] }]}>
                      {p === 'high' ? '🔴 Tinggi' : p === 'med' ? '🟡 Sedang' : '🔵 Rendah'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* TextInput + Tombol Add */}
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.taskInput, inputError ? { borderColor: COLORS.accent2 } : null]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Tambah task baru..."
                placeholderTextColor={COLORS.muted}
                maxLength={100}
                onSubmitEditing={addTask}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addBtn} onPress={addTask} activeOpacity={0.8}>
                <Text style={styles.addBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Pesan error — conditional rendering (P04) */}
            {inputError ? (
              <Text style={styles.errorMsg}>{inputError}</Text>
            ) : null}
          </View>
        </View>

        {/* ── FILTER CHIPS — P06 ── */}
        <View style={styles.filtersWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
            {[
              { key: 'all', label: 'Semua' },
              { key: 'active', label: 'Aktif' },
              { key: 'done', label: 'Selesai' },
              { key: 'high', label: '🔴 Tinggi' },
              { key: 'med', label: '🟡 Sedang' },
              { key: 'low', label: '🔵 Rendah' },
            ].map(f => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterBtn, activeFilter === f.key && styles.filterBtnActive]}
                onPress={() => setActiveFilter(f.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterBtnText, activeFilter === f.key && { color: '#fff' }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── SORT BUTTONS ── */}
        <View style={styles.sortRow}>
          {[
            { key: 'default', label: 'Default' },
            { key: 'priority', label: 'Prioritas' },
            { key: 'name', label: 'Nama' },
          ].map(s => (
            <TouchableOpacity
              key={s.key}
              style={[styles.sortBtn, activeSort === s.key && styles.sortBtnActive]}
              onPress={() => setActiveSort(s.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.sortBtnText, activeSort === s.key && { color: COLORS.accent }]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── FLATLIST — P06 ── */}
        <FlatList
          data={filteredTasks}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState hasAnyTask={tasks.length > 0} />}
          renderItem={({ item }) => (
            <TaskCard task={item} onToggle={toggleDone} onDelete={deleteTask} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />

        {/* ── COUNTER BAR ── */}
        <View style={styles.counterBar}>
          <Text style={styles.counterText}>
            <Text style={{ color: COLORS.done, fontWeight: '600' }}>{doneTask}</Text>
            {` selesai dari ${totalTask}`}
          </Text>
          <View style={styles.progressWrap}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.pctText}>{pct}%</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  greeting: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 2,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },

  // Input area (P05)
  inputArea: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    gap: 10,
  },
  prioRow: {
    flexDirection: 'row',
    gap: 6,
  },
  prioPickBtn: {
    flex: 1,
    backgroundColor: COLORS.surface2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 7,
    alignItems: 'center',
  },
  prioPickText: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  taskInput: {
    flex: 1,
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 28,
  },
  errorMsg: {
    fontSize: 12,
    color: COLORS.accent2,
    paddingHorizontal: 2,
  },

  // Filters (P06)
  filtersWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filters: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterBtnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  filterBtnText: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '500',
  },

  // Sort
  sortRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sortBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  sortBtnActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent + '18',
  },
  sortBtnText: {
    fontSize: 11,
    color: COLORS.muted,
  },

  // FlatList (P06)
  listContent: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },

  // Task Card
  taskCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  taskCardDone: {
    opacity: 0.55,
  },
  prioStripe: {
    width: 3,
    alignSelf: 'stretch',
  },
  checkBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 14,
    marginRight: 8,
    flexShrink: 0,
  },
  checkIcon: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  taskInfo: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 4,
  },
  taskTitle: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    lineHeight: 20,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: COLORS.muted,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
    flexWrap: 'wrap',
  },
  prioBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  prioBadgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  taskTime: {
    fontSize: 10,
    color: COLORS.muted,
  },
  delBtn: {
    padding: 14,
    paddingLeft: 8,
  },
  delBtnText: {
    fontSize: 14,
    color: COLORS.muted,
  },

  // Empty State (P06 ListEmptyComponent)
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyIcon: {
    fontSize: 52,
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.muted,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.muted,
    opacity: 0.7,
    textAlign: 'center',
  },

  // Counter bar (P04 bonus — counter)
  counterBar: {
    backgroundColor: COLORS.surface2,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  counterText: {
    fontSize: 12,
    color: COLORS.muted,
    minWidth: 110,
  },
  progressWrap: {
    flex: 1,
    height: 3,
    backgroundColor: COLORS.border,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  pctText: {
    fontSize: 12,
    color: COLORS.muted,
    minWidth: 32,
    textAlign: 'right',
  },
});
