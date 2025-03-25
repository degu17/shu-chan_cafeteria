import { supabase, BusinessCalendar } from '../supabase';

// 営業カレンダー関連の関数
export async function getBusinessCalendar() {
  try {
    const { data, error } = await supabase
      .from('business_calendar_tbl')
      .select('*');
    
    if (error) {
      console.error('営業カレンダー全体の取得に失敗しました:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    return data as BusinessCalendar[];
  } catch (e) {
    console.error('営業カレンダー全体の取得中に予期せぬエラーが発生しました:', e);
    throw e;
  }
}

export async function getBusinessCalendarByDay(day: string) {
  // デフォルト値を準備
  const defaultCalendar = {
    day: day,
    holiday: false,
    start_time: '17:00',
    end_time: '21:00'
  } as BusinessCalendar;
  
  try {
    // 日付形式のバリデーション (YYYY-MM-DD形式を期待)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      console.warn(`無効な日付形式です: ${day}`);
      return defaultCalendar;
    }
    
    const { data, error } = await supabase
      .from('business_calendar_tbl')
      .select('*')
      .eq('day', day)
      .maybeSingle();
    
    // エラーの詳細をログに出力
    if (error) {
      console.error(`営業カレンダーデータの取得エラー: ${day}`, JSON.stringify(error, null, 2));
      return defaultCalendar;
    }
    
    // データが存在しない場合
    if (!data) {
      console.info(`指定日の営業カレンダーデータが存在しません: ${day}、デフォルト値を使用します`);
      return defaultCalendar;
    }
    
    // データを返す（nullのフィールドはそのまま、undefinedのフィールドはデフォルト値で埋める）
    return {
      ...defaultCalendar,
      ...data,
      // nullは有効な値として保持し、undefinedの場合のみデフォルト値を使用
      start_time: data.start_time ?? defaultCalendar.start_time,
      end_time: data.end_time ?? defaultCalendar.end_time
    } as BusinessCalendar;
  } catch (e) {
    console.error('営業カレンダーの取得中に予期せぬエラーが発生しました:', e);
    return defaultCalendar;
  }
}

// 特定の日付の営業時間を更新する関数
export async function updateBusinessTime(date: string, startTime: string, endTime: string) {
  try {
    // 日付形式のバリデーション
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`無効な日付形式です: ${date}`);
    }
    
    // 時間形式のバリデーション (HH:MM形式を期待)
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(startTime) || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(endTime)) {
      throw new Error(`無効な時間形式です: ${startTime} または ${endTime}`);
    }
    
    const { error } = await supabase
      .from('business_calendar_tbl')
      .upsert(
        {
          day: date,
          start_time: startTime,
          end_time: endTime
        },
        {
          onConflict: 'day'
        }
      );
    
    if (error) {
      console.error('営業時間の更新に失敗しました:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    return true;
  } catch (e) {
    console.error('営業時間の更新中に予期せぬエラーが発生しました:', e);
    throw e;
  }
}

// 特定の日付の営業時間を取得する関数
export async function getBusinessTimeByDate(date: string) {
  // デフォルト値を準備
  const defaultTime = {
    start_time: '17:00',
    end_time: '21:00'
  };
  
  try {
    // 日付形式のバリデーション (YYYY-MM-DD形式を期待)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.warn(`無効な日付形式です: ${date}`);
      return defaultTime;
    }
    
    // 接続テスト - アクセス権限の確認
    const testConnection = await supabase.from('business_calendar_tbl').select('*', { count: 'exact', head: true });
    if (testConnection.error) {
      console.error('Supabase接続テストに失敗しました:', JSON.stringify(testConnection.error, null, 2));
      return defaultTime;
    }
    
    const { data, error } = await supabase
      .from('business_calendar_tbl')
      .select('start_time, end_time')
      .eq('day', date)
      .maybeSingle();
    
    if (error) {
      console.error(`営業時間データの取得エラー: ${date}`, JSON.stringify(error, null, 2));
      
      // エラーコードによって異なる対応を実施
      if (error.code === '406') {
        console.warn('406エラー：リクエストの形式に問題があります。日付形式を確認してください。');
      } else if (error.code === '403') {
        console.warn('403エラー：アクセス権限がありません。Supabaseの認証状態を確認してください。');
      }
      
      return defaultTime;
    }
    
    // データが存在しない場合
    if (!data) {
      console.info(`指定日の営業時間データが存在しません: ${date}、デフォルト値を使用します`);
      return defaultTime;
    }
    
    // データを返す（nullは有効な値として保持せず、デフォルト値を適用）
    return {
      start_time: data.start_time || defaultTime.start_time,
      end_time: data.end_time || defaultTime.end_time
    };
  } catch (e) {
    console.error('営業時間の取得中に予期せぬエラーが発生しました:', e);
    return defaultTime;
  }
}

// 特定の日付の休業日フラグを更新する関数
export async function updateHolidayStatus(date: string, isHoliday: boolean) {
  try {
    // 日付形式のバリデーション
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`無効な日付形式です: ${date}`);
    }
    
    const { error } = await supabase
      .from('business_calendar_tbl')
      .upsert(
        {
          day: date,
          holiday: isHoliday
        },
        {
          onConflict: 'day'
        }
      );
    
    if (error) {
      console.error('休業日設定の更新に失敗しました:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    return true;
  } catch (e) {
    console.error('休業日設定の更新中に予期せぬエラーが発生しました:', e);
    throw e;
  }
}

// 特定の日付の休業日フラグを取得する関数
export async function getHolidayStatus(date: string) {
  try {
    // 日付形式のバリデーション (YYYY-MM-DD形式を期待)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.warn(`無効な日付形式です: ${date}`);
      return false;
    }
    
    const { data, error } = await supabase
      .from('business_calendar_tbl')
      .select('holiday')
      .eq('day', date)
      .maybeSingle();
    
    if (error) {
      console.error(`休業日情報の取得エラー: ${date}`, JSON.stringify(error, null, 2));
      return false;
    }
    
    // データが存在しない場合またはholidayがnullの場合はfalseを返す
    return data?.holiday || false;
  } catch (e) {
    console.error('休業日情報の取得中に予期せぬエラーが発生しました:', e);
    return false;
  }
}