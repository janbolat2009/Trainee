/**
 * Centralized Date & Timezone Utilities
 * Automatically converts and formats all ISO consultation dates/times into the user device's local timezone.
 */

export const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time';
  } catch {
    return 'Local Time';
  }
};

export const getUserTimezoneOffset = (): string => {
  try {
    const offsetMinutes = -new Date().getTimezoneOffset();
    const hours = Math.floor(Math.abs(offsetMinutes) / 60);
    const mins = Math.abs(offsetMinutes) % 60;
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const formattedMins = mins > 0 ? `:${mins.toString().padStart(2, '0')}` : '';
    return `GMT${sign}${hours}${formattedMins}`;
  } catch {
    return 'Local Time';
  }
};

export const formatInUserTimezone = (
  isoString: string,
  options?: Intl.DateTimeFormatOptions,
): string => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleString('en-GB', {
      ...options,
    });
  } catch {
    return isoString;
  }
};

export const formatTimeInUserTimezone = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
};

export const formatDateInUserTimezone = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
};

export const formatTimeRangeInUserTimezone = (
  startsAtIso: string,
  endsAtIso: string,
): { formattedDate: string; formattedStart: string; formattedEnd: string; tzLabel: string } => {
  const formattedDate = formatDateInUserTimezone(startsAtIso);
  const formattedStart = formatTimeInUserTimezone(startsAtIso);
  const formattedEnd = formatTimeInUserTimezone(endsAtIso);
  const tzLabel = getUserTimezoneOffset();

  return {
    formattedDate,
    formattedStart,
    formattedEnd,
    tzLabel,
  };
};

export const formatFullDateTimeInUserTimezone = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const formatted = date.toLocaleString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${formatted} (${getUserTimezoneOffset()})`;
  } catch {
    return isoString;
  }
};
