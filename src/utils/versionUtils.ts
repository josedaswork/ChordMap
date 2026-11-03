import { Song, SongVersion } from '../types';

/**
 * Ensures a song has a valid, non-empty versions array.
 * If song.versions is missing or empty, synthesizes a default "Original" version
 * matching the root song capo, tuning, and sectionsJson.
 */
export function ensureSongVersions(song: Song): SongVersion[] {
  if (song.versions && Array.isArray(song.versions) && song.versions.length > 0) {
    const hasDefault = song.versions.some(v => v.isDefault || v.id === song.defaultVersionId);
    return song.versions.map((v, idx) => ({
      ...v,
      isDefault: hasDefault 
        ? (v.id === song.defaultVersionId || (v.isDefault && !song.defaultVersionId))
        : idx === 0
    }));
  }

  // Synthesize default version for legacy songs
  const defaultVersion: SongVersion = {
    id: `v_orig_${song.id || Date.now()}`,
    name: 'Original',
    capo: song.capo ?? 0,
    tuning: song.tuning || 'Estándar',
    sectionsJson: song.sectionsJson || '[]',
    lyrics: song.lyrics || '',
    isDefault: true,
    mainChords: song.mainChords ? [...song.mainChords] : []
  };

  return [defaultVersion];
}

/**
 * Safely parses cloud versions JSON string, returning a validated array of SongVersions
 * or undefined if missing/invalid.
 */
export function parseCloudVersions(versionsJson?: string): SongVersion[] | undefined {
  if (!versionsJson || typeof versionsJson !== 'string' || versionsJson.trim() === '') {
    return undefined;
  }
  try {
    const parsed = JSON.parse(versionsJson);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item: any, idx: number) => ({
        id: item.id || `v_${idx}_${Date.now()}`,
        name: item.name || (idx === 0 ? 'Original' : `Versión ${idx + 1}`),
        capo: item.capo !== undefined ? Number(item.capo) : 0,
        tuning: item.tuning || 'Estándar',
        sectionsJson: typeof item.sectionsJson === 'string' ? item.sectionsJson : JSON.stringify(item.sectionsJson || []),
        lyrics: item.lyrics || '',
        isDefault: Boolean(item.isDefault),
        mainChords: Array.isArray(item.mainChords) ? item.mainChords : []
      }));
    }
  } catch {
    return undefined;
  }
  return undefined;
}

/**
 * Returns the principal (default) version of a song.
 */
export function getPrincipalVersion(song: Song): SongVersion {
  const versions = ensureSongVersions(song);
  const found = versions.find(v => v.id === song.defaultVersionId || v.isDefault);
  return found || versions[0];
}

/**
 * Returns the currently active version for editing, falling back to principal.
 */
export function getActiveVersion(song: Song, activeVersionId?: string | null): SongVersion {
  const versions = ensureSongVersions(song);
  if (activeVersionId) {
    const found = versions.find(v => v.id === activeVersionId);
    if (found) return found;
  }
  return getPrincipalVersion(song);
}

/**
 * Updates a specific version inside a song. If this version is the principal version,
 * also mirrors its capo, tuning, and sectionsJson to the root song fields.
 */
export function applyVersionUpdate(
  song: Song, 
  versionId: string, 
  updates: Partial<SongVersion>
): Song {
  const currentVersions = ensureSongVersions(song);
  const isTargetPrincipal = currentVersions.some(
    v => v.id === versionId && (v.isDefault || v.id === song.defaultVersionId)
  );

  const updatedVersions = currentVersions.map(v => {
    if (v.id === versionId) {
      return { ...v, ...updates };
    }
    return v;
  });

  const updatedSong: Song = {
    ...song,
    versions: updatedVersions,
    updatedDate: Date.now()
  };

  // If the updated version is the principal version, synchronize root properties
  if (isTargetPrincipal) {
    const activeV = updatedVersions.find(v => v.id === versionId);
    if (activeV) {
      if (updates.capo !== undefined) updatedSong.capo = updates.capo;
      if (updates.tuning !== undefined) updatedSong.tuning = updates.tuning;
      if (updates.sectionsJson !== undefined) updatedSong.sectionsJson = updates.sectionsJson;
      if (updates.lyrics !== undefined) updatedSong.lyrics = updates.lyrics;
      if (updates.mainChords !== undefined) updatedSong.mainChords = updates.mainChords;
    }
  }

  return updatedSong;
}

/**
 * Sets a specific version as the principal (default) version of the song.
 * Updates isDefault across all versions and mirrors its info to the root song fields.
 */
export function setPrincipalVersion(song: Song, versionId: string): Song {
  const currentVersions = ensureSongVersions(song);
  const target = currentVersions.find(v => v.id === versionId);
  if (!target) return song;

  const updatedVersions = currentVersions.map(v => ({
    ...v,
    isDefault: v.id === versionId
  }));

  return {
    ...song,
    versions: updatedVersions,
    defaultVersionId: versionId,
    capo: target.capo,
    tuning: target.tuning,
    sectionsJson: target.sectionsJson,
    lyrics: target.lyrics ?? song.lyrics,
    mainChords: target.mainChords ?? song.mainChords,
    updatedDate: Date.now()
  };
}

/**
 * Clones/duplicates a version (sections, capo, tuning, main chords) with a new name and ID.
 */
export function duplicateVersion(
  song: Song, 
  sourceVersionId: string, 
  customName?: string
): { song: Song; newVersion: SongVersion } {
  const currentVersions = ensureSongVersions(song);
  const source = currentVersions.find(v => v.id === sourceVersionId) || currentVersions[0];
  
  const newId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newName = customName?.trim() || `${source.name} (Copia)`;

  const newVersion: SongVersion = {
    id: newId,
    name: newName,
    capo: source.capo,
    tuning: source.tuning,
    sectionsJson: source.sectionsJson,
    lyrics: source.lyrics || song.lyrics || '',
    isDefault: false,
    mainChords: source.mainChords ? [...source.mainChords] : (song.mainChords ? [...song.mainChords] : [])
  };

  const updatedSong: Song = {
    ...song,
    versions: [...currentVersions, newVersion],
    updatedDate: Date.now()
  };

  return { song: updatedSong, newVersion };
}

/**
 * Adds a new version to the song.
 */
export function addNewVersion(
  song: Song,
  name: string,
  options?: { capo?: number; tuning?: string; sectionsJson?: string; lyrics?: string; mainChords?: string[] }
): { song: Song; newVersion: SongVersion } {
  const currentVersions = ensureSongVersions(song);
  const newId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newVersion: SongVersion = {
    id: newId,
    name: name.trim() || `Versión ${currentVersions.length + 1}`,
    capo: options?.capo ?? 0,
    tuning: options?.tuning || 'Estándar',
    sectionsJson: options?.sectionsJson || '[]',
    lyrics: options?.lyrics || '',
    isDefault: false,
    mainChords: options?.mainChords ? [...options.mainChords] : []
  };

  const updatedSong: Song = {
    ...song,
    versions: [...currentVersions, newVersion],
    updatedDate: Date.now()
  };

  return { song: updatedSong, newVersion };
}

/**
 * Deletes a version. Cannot delete if it is the only version.
 * If deleting the principal version, the first remaining version becomes principal.
 */
export function deleteVersion(
  song: Song, 
  versionIdToDelete: string
): { song: Song; nextActiveVersionId: string } {
  const currentVersions = ensureSongVersions(song);
  if (currentVersions.length <= 1) {
    return { song, nextActiveVersionId: currentVersions[0].id };
  }

  const remaining = currentVersions.filter(v => v.id !== versionIdToDelete);
  const wasPrincipal = currentVersions.find(v => v.id === versionIdToDelete)?.isDefault || 
                       song.defaultVersionId === versionIdToDelete;

  let nextDefault = remaining.find(v => v.isDefault);
  if (!nextDefault || wasPrincipal) {
    nextDefault = remaining[0];
  }

  const updatedVersions = remaining.map(v => ({
    ...v,
    isDefault: v.id === nextDefault!.id
  }));

  const updatedSong: Song = {
    ...song,
    versions: updatedVersions,
    defaultVersionId: nextDefault.id,
    capo: nextDefault.capo,
    tuning: nextDefault.tuning,
    sectionsJson: nextDefault.sectionsJson,
    lyrics: nextDefault.lyrics ?? song.lyrics,
    updatedDate: Date.now()
  };

  return { song: updatedSong, nextActiveVersionId: nextDefault.id };
}
