import dbConnect from './mongoose';
import SystemSettings, { ISystemSettings } from '@/models/SystemSettings';

export interface GameAccessStatus {
  isLocked: boolean;
  unlockTime: string | null; // ISO string
  serverTime: string; // ISO string
  timeRemainingSeconds: number; // in seconds
  isAccessBlocked: boolean;
  message: string;
  updatedAt: string | null;
}

export async function getGameAccessStatus(): Promise<GameAccessStatus> {
  await dbConnect();
  
  let settings = await SystemSettings.findOne({ key: 'game_access' });
  if (!settings) {
    settings = await SystemSettings.create({
      key: 'game_access',
      realGameUnlockTime: null,
      isAccessBlocked: false,
      message: '',
      updatedBy: 'system'
    });
  }

  const now = new Date();
  const unlockDate = settings.realGameUnlockTime ? new Date(settings.realGameUnlockTime) : null;

  let isLocked = false;
  let timeRemainingSeconds = 0;

  if (unlockDate && unlockDate.getTime() > now.getTime()) {
    isLocked = true;
    timeRemainingSeconds = Math.max(0, Math.floor((unlockDate.getTime() - now.getTime()) / 1000));
  } else if (settings.isAccessBlocked && !unlockDate) {
    isLocked = true;
  } else {
    isLocked = false;
  }

  return {
    isLocked,
    unlockTime: unlockDate ? unlockDate.toISOString() : null,
    serverTime: now.toISOString(),
    timeRemainingSeconds,
    isAccessBlocked: !!settings.isAccessBlocked,
    message: settings.message || '',
    updatedAt: settings.updatedAt ? new Date(settings.updatedAt).toISOString() : null,
  };
}

export async function updateGameAccessSettings(params: {
  realGameUnlockTime?: string | Date | null;
  isAccessBlocked?: boolean;
  message?: string;
  updatedBy?: string;
}): Promise<GameAccessStatus> {
  await dbConnect();

  const updateDoc: any = {};

  if (params.realGameUnlockTime !== undefined) {
    if (params.realGameUnlockTime === null || params.realGameUnlockTime === '') {
      updateDoc.realGameUnlockTime = null;
    } else {
      const date = new Date(params.realGameUnlockTime);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid unlock date/time format');
      }
      updateDoc.realGameUnlockTime = date;
    }
  }

  if (params.isAccessBlocked !== undefined) {
    updateDoc.isAccessBlocked = Boolean(params.isAccessBlocked);
  }

  if (params.message !== undefined) {
    updateDoc.message = String(params.message).trim();
  }

  if (params.updatedBy !== undefined) {
    updateDoc.updatedBy = String(params.updatedBy);
  }

  await SystemSettings.findOneAndUpdate(
    { key: 'game_access' },
    { $set: updateDoc },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  return getGameAccessStatus();
}
