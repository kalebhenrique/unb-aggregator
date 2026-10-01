import { useState, useEffect, useCallback } from 'react';
import { useContainer } from '../context/ContainerContext';
import type { FeedItem, Course, PlatformType, FeedItemType } from '@unb-aggregator/core';

export function useFeed() {
  const { useCases } = useContainer();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncErrors, setSyncErrors] = useState<Partial<Record<PlatformType, string>> | null>(null);

  // Filtros ativos
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | 'all'>('all');
  const [selectedType, setSelectedType] = useState<FeedItemType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadFeed = useCallback(async () => {
    setIsLoading(true);
    try {
      const feedItems = await useCases.getFeed.execute({
        platform: selectedPlatform,
        itemType: selectedType,
        searchQuery,
      });
      setItems(feedItems);

      const courseList = await useCases.getCourses.execute();
      setCourses(courseList);
    } catch (err) {
      console.error('Erro ao carregar itens do feed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [useCases, selectedPlatform, selectedType, searchQuery]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const sync = async (platforms?: PlatformType[]) => {
    setIsSyncing(true);
    setSyncErrors(null);
    try {
      const result = await useCases.syncPlatforms.execute(platforms);
      setItems(result.items);
      setCourses(result.courses);
      setLastSyncedAt(result.syncedAt);
      if (result.errors && Object.keys(result.errors).length > 0) {
        setSyncErrors(result.errors);
      }
      return result;
    } catch (err) {
      console.error('Erro durante a sincronização:', err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleTaskCompleted = async (id: string, currentStatus?: boolean) => {
    const nextStatus = !currentStatus;
    await useCases.getFeed.markAsCompleted(id, nextStatus);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isCompleted: nextStatus } : item))
    );
  };

  return {
    items,
    courses,
    isLoading,
    isSyncing,
    lastSyncedAt,
    syncErrors,
    selectedPlatform,
    setSelectedPlatform,
    selectedType,
    setSelectedType,
    searchQuery,
    setSearchQuery,
    sync,
    refresh: loadFeed,
    toggleTaskCompleted,
  };
}
