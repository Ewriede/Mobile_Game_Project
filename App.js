
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import SpinWheel from './src/components/SpinWheel';
import { SPIN_ORDER, WHEEL_OPTIONS } from './src/data/WheelData';

const SAVE_KEY = '@wheel_of_fate_v2';

const TABS = ['Home', 'Wheel', 'Characters', 'Profile'];

// Reusable button
function GameButton({ title, onPress, secondary = false, danger = false }) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        secondary && styles.secondaryButton,
        danger && styles.dangerButton,
      ]}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}

// Reusable character stat row
function StatRow({ label, value }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {value !== undefined ? String(value) : 'Not Rolled'}
      </Text>
    </View>
  );
}

export default function App() {
  const [tab, setTab] = useState('Home');

  const [playerName, setPlayerName] = useState('');
  const [characterName, setCharacterName] = useState('');

  const [characters, setCharacters] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const [detailsId, setDetailsId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [lastSpin, setLastSpin] = useState(null);

  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // LOAD SAVED DATA
  useEffect(() => {
    async function loadGame() {
      try {
        const saved = await AsyncStorage.getItem(SAVE_KEY);

        if (saved !== null) {
          const data = JSON.parse(saved);

          setPlayerName(data.playerName || '');
          setCharacters(
            Array.isArray(data.characters) ? data.characters : []
          );
          setActiveId(data.activeId || null);
        }
      } catch (error) {
        console.log('Loading failed:', error);
        setSaveError(true);
      } finally {
        setLoaded(true);
      }
    }

    loadGame();
  }, []);

  // SAVE DATA WHENEVER IT CHANGES
  useEffect(() => {
    if (!loaded) return;

    async function saveGame() {
      try {
        const data = {
          playerName,
          characters,
          activeId,
        };

        await AsyncStorage.setItem(
          SAVE_KEY,
          JSON.stringify(data)
        );
        setSaveError(false);
      } catch (error) {
        console.log('Saving failed:', error);
        setSaveError(true);
      }
    }

    saveGame();
  }, [loaded, playerName, characters, activeId]);

  const activeCharacter =
    characters.find(c => c.id === activeId) || null;

  const detailCharacter =
    characters.find(c => c.id === detailsId) || null;

  const progress = activeCharacter
    ? SPIN_ORDER.filter(
        step => activeCharacter.results[step] !== undefined
      ).length
    : 0;

  const nextStep = activeCharacter
    ? SPIN_ORDER.find(
        step => activeCharacter.results[step] === undefined
      )
    : null;

  // NAVIGATION
  function changeTab(newTab) {
    setTab(newTab);
    setLastSpin(null);

    if (newTab !== 'Characters') {
      setDetailsId(null);
    }

    setDeleteId(null);
  }

  // CREATE A NEW CHARACTER
  function createCharacter() {
    const name = characterName.trim();

    if (!name) return;

    const newCharacter = {
      id: Date.now().toString() +
        Math.random().toString(36).slice(2),
      name: name,
      createdAt: Date.now(),
      results: {},
      history: [],
    };

    setCharacters(previous => [...previous, newCharacter]);
    setActiveId(newCharacter.id);
    setCharacterName('');
    setLastSpin(null);
    setDetailsId(null);
    setTab('Wheel');
  }

  // SELECT A CHARACTER
  function selectCharacter(id) {
    setActiveId(id);
    setLastSpin(null);
    setDetailsId(null);
    setTab('Wheel');
  }

  // SAVE THE RESULT OF A SPIN
  function handleSpinResult(value) {
    if (!activeCharacter || !nextStep) return;

    const category = nextStep;
    const characterId = activeCharacter.id;

    setCharacters(previous =>
      previous.map(character => {
        if (character.id !== characterId) {
          return character;
        }

        if (character.results[category] !== undefined) {
          return character;
        }

        return {
          ...character,
          results: {
            ...character.results,
            [category]: value,
          },
          history: [
            ...(character.history || []),
            {
              category,
              value,
              date: Date.now(),
            },
          ],
        };
      })
    );

    setLastSpin({
      characterId,
      category,
      value,
    });
  }

  // DELETE A CHARACTER
  function deleteCharacter(id) {
    setCharacters(previous =>
      previous.filter(character => character.id !== id)
    );

    if (activeId === id) {
      setActiveId(null);
    }

    if (detailsId === id) {
      setDetailsId(null);
    }

    setDeleteId(null);
    setLastSpin(null);
  }

  // LOADING SCREEN
  if (!loaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#A78BFA" />
        <Text style={styles.description}>Loading Wheel of Fate...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        Platform.OS === 'android' && {
          paddingTop: StatusBar.currentHeight || 0,
        },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0B1120" />

      {/* APP HEADER */}
      <View style={styles.header}>
        <Text style={styles.logo}>WHEEL OF FATE</Text>
        <Text style={styles.headerSubtitle}>
          Create Your Destiny
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {saveError && (
          <Text style={styles.warning}>
            Storage error. Your latest changes may not be saved.
          </Text>
        )}

        {/* HOME TAB */}
        {tab === 'Home' && (
          <View>
            <Text style={styles.title}>
              Welcome, {playerName.trim() || 'Guest'}!
            </Text>

            <Text style={styles.description}>
              Create characters, spin the wheels, and see
              what kind of fighters you get!
            </Text>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Active Character</Text>

              {activeCharacter ? (
                <>
                  <Text style={styles.characterTitle}>
                    {activeCharacter.name}
                  </Text>

                  <Text style={styles.description}>
                    Completed {progress} of {SPIN_ORDER.length} spins
                  </Text>

                  <Text style={styles.description}>
                    {nextStep
                      ? `Next Spin: ${nextStep}`
                      : 'All spins completed!'}
                  </Text>

                  <GameButton
                    title={
                      nextStep ? 'Continue Character' : 'View Character'
                    }
                    onPress={() => {
                      if (nextStep) {
                        changeTab('Wheel');
                      } else {
                        setDetailsId(activeId);
                        changeTab('Characters');
                      }
                    }}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.description}>
                    You do not have an active character.
                  </Text>

                  <GameButton
                    title="Create a Character"
                    onPress={() => changeTab('Characters')}
                  />
                </>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Your Collection</Text>

              <Text style={styles.bigNumber}>
                {characters.length}
              </Text>

              <Text style={styles.description}>
                Characters created
              </Text>

              <GameButton
                title="View Characters"
                secondary
                onPress={() => changeTab('Characters')}
              />
            </View>
          </View>
        )}

        {/* WHEEL TAB */}
        {tab === 'Wheel' && (
          <View>
            <Text style={styles.title}>Wheel of Fate</Text>

            {!activeCharacter ? (
              <View style={styles.card}>
                <Text style={styles.description}>
                  You must create or select a character first.
                </Text>

                <GameButton
                  title="Go to Characters"
                  onPress={() => changeTab('Characters')}
                />
              </View>
            ) : (
              <>
                <Text style={styles.centerText}>
                  Character: {activeCharacter.name}
                </Text>

                <Text style={styles.centerText}>
                  {progress} / {SPIN_ORDER.length} Spins
                </Text>

                {/* SHOW THE MOST RECENT RESULT */}
                {lastSpin &&
                lastSpin.characterId === activeId ? (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                      Spin Result
                    </Text>

                    <Text style={styles.resultCategory}>
                      {lastSpin.category}
                    </Text>

                    <Text style={styles.resultText}>
                      {lastSpin.value}
                    </Text>

                    <GameButton
                      title={
                        nextStep
                          ? `Next Wheel: ${nextStep}`
                          : 'Finish Character'
                      }
                      onPress={() => setLastSpin(null)}
                    />
                  </View>
                ) : nextStep ? (
                  <>
                    <Text style={styles.categoryTitle}>
                      {nextStep}
                    </Text>

                    <SpinWheel
                      key={`${activeId}-${nextStep}`}
                      options={WHEEL_OPTIONS[nextStep]}
                      onResult={handleSpinResult}
                    />

                    <Text style={styles.hint}>
                      Your result will be permanently added
                      to this character when the wheel stops.
                    </Text>
                  </>
                ) : (
                  <View style={styles.card}>
                    <Text style={styles.completed}>
                      CHARACTER COMPLETE!
                    </Text>

                    <Text style={styles.description}>
                      All wheel categories have been completed.
                    </Text>

                    <GameButton
                      title="View Character Stats"
                      onPress={() => {
                        setDetailsId(activeId);
                        changeTab('Characters');
                      }}
                    />
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* CHARACTERS TAB */}
        {tab === 'Characters' && (
          <View>
            {detailCharacter ? (
              <>
                <Text style={styles.title}>
                  {detailCharacter.name}
                </Text>

                <GameButton
                  title="Back to Characters"
                  secondary
                  onPress={() => setDetailsId(null)}
                />

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>
                    Character Stats
                  </Text>

                  {SPIN_ORDER.map(category => (
                    <StatRow
                      key={category}
                      label={category}
                      value={detailCharacter.results[category]}
                    />
                  ))}
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>
                    Spin History
                  </Text>

                  {(detailCharacter.history || []).length === 0 ? (
                    <Text style={styles.description}>
                      This character has no spin history yet.
                    </Text>
                  ) : (
                    detailCharacter.history.map((entry, index) => (
                      <StatRow
                        key={index}
                        label={entry.category}
                        value={entry.value}
                      />
                    ))
                  )}
                </View>

                <GameButton
                  title="Spin for This Character"
                  onPress={() => selectCharacter(detailCharacter.id)}
                />
              </>
            ) : (
              <>
                <Text style={styles.title}>My Characters</Text>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>
                    Create New Character
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Enter character name"
                    placeholderTextColor="#94A3B8"
                    value={characterName}
                    onChangeText={setCharacterName}
                    maxLength={30}
                  />

                  <GameButton
                    title="Create Character"
                    onPress={createCharacter}
                  />
                </View>

                {characters.length === 0 && (
                  <Text style={styles.description}>
                    No characters created yet.
                  </Text>
                )}

                {characters.map(character => {
                  const count = SPIN_ORDER.filter(
                    step => character.results[step] !== undefined
                  ).length;

                  return (
                    <View style={styles.card} key={character.id}>
                      <Text style={styles.characterTitle}>
                        {character.name}
                      </Text>

                      {character.id === activeId && (
                        <Text style={styles.activeLabel}>
                          ACTIVE CHARACTER
                        </Text>
                      )}

                      <Text style={styles.description}>
                        Progress: {count}/{SPIN_ORDER.length}
                      </Text>

                      <GameButton
                        title="Select & Spin"
                        onPress={() => selectCharacter(character.id)}
                      />

                      <GameButton
                        title="View Stats"
                        secondary
                        onPress={() => setDetailsId(character.id)}
                      />

                      {deleteId === character.id ? (
                        <View>
                          <Text style={styles.warning}>
                            Permanently delete {character.name}?
                          </Text>

                          <GameButton
                            title="Confirm Delete"
                            danger
                            onPress={() => deleteCharacter(character.id)}
                          />

                          <GameButton
                            title="Cancel"
                            secondary
                            onPress={() => setDeleteId(null)}
                          />
                        </View>
                      ) : (
                        <GameButton
                          title="Delete Character"
                          danger
                          onPress={() => setDeleteId(character.id)}
                        />
                      )}
                    </View>
                  );
                })}
              </>
            )}
          </View>
        )}

        {/* PROFILE TAB */}
        {tab === 'Profile' && (
          <View>
            <Text style={styles.title}>Player Profile</Text>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                Local Player Profile
              </Text>

              <Text style={styles.description}>
                Player Name
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor="#94A3B8"
                value={playerName}
                onChangeText={setPlayerName}
                maxLength={30}
              />

              <Text style={styles.description}>
                Display Name: {playerName.trim() || 'Guest'}
              </Text>

              <Text style={styles.hint}>
                Your name saves automatically on this device.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Player Statistics</Text>

              <StatRow
                label="Characters Created"
                value={characters.length}
              />

              <StatRow
                label="Completed Characters"
                value={characters.filter(character =>
                  SPIN_ORDER.every(step =>
                    character.results[step] !== undefined
                  )
                ).length}
              />

              <StatRow
                label="Total Spins"
                value={characters.reduce(
                  (total, character) =>
                    total + (character.history || []).length,
                  0
                )}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Account System</Text>

              <Text style={styles.description}>
                This version uses a local profile. Your saved
                characters remain on this device.
              </Text>

              <Text style={styles.description}>
                Secure login, online accounts, and multiplayer
                profiles will be added when we connect the
                game to a backend.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* BOTTOM TAB NAVIGATION */}
      <View style={styles.tabBar}>
        {TABS.map(item => (
          <TouchableOpacity
            key={item}
            style={[
              styles.tab,
              tab === item && styles.selectedTab,
            ]}
            onPress={() => changeTab(item)}
          >
            <Text style={[
              styles.tabText,
              tab === item && styles.selectedTabText,
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  loading: {
    flex: 1,
    backgroundColor: '#0B1120',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: '#111827',
    padding: 18,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  logo: {
    color: '#FACC15',
    fontSize: 25,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#CBD5E1',
    fontSize: 13,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  centerText: {
    color: '#CBD5E1',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 7,
  },
  card: {
    backgroundColor: '#1E293B',
    padding: 18,
    borderRadius: 14,
    marginBottom: 18,
  },
  cardTitle: {
    color: '#FACC15',
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  characterTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  bigNumber: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#7C3AED',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 6,
  },
  secondaryButton: {
    backgroundColor: '#475569',
  },
  dangerButton: {
    backgroundColor: '#991B1B',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#334155',
    color: '#FFFFFF',
    fontSize: 16,
    padding: 14,
    borderRadius: 9,
    marginBottom: 12,
  },
  categoryTitle: {
    color: '#FACC15',
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 18,
  },
  resultCategory: {
    color: '#CBD5E1',
    fontSize: 18,
    textAlign: 'center',
  },
  resultText: {
    color: '#22C55E',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 25,
  },
  completed: {
    color: '#22C55E',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 18,
  },
  hint: {
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 13,
    marginTop: 12,
  },
  activeLabel: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  warning: {
    color: '#FCA5A5',
    fontSize: 14,
    marginVertical: 12,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#334155',
    paddingVertical: 10,
    gap: 10,
  },
  statLabel: {
    color: '#CBD5E1',
    fontSize: 14,
    flex: 1,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
    flexShrink: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 3,
    borderColor: 'transparent',
  },
  selectedTab: {
    borderColor: '#FACC15',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedTabText: {
    color: '#FACC15',
  },
});
