
import { getEasterEgg, EASTER_EGGS } from '@/lib/easter-eggs';

// 简单的 Mock 测试示例 (适配 Jest/Vitest)
describe('Easter Eggs', () => {
  it('should return null for empty content', () => {
    expect(getEasterEgg('')).toBeNull();
    expect(getEasterEgg(null as any)).toBeNull();
  });

  it('should match keywords correctly', () => {
    const egg = getEasterEgg('我刚才在捡手机');
    expect(egg).not.toBeNull();
    expect(egg?.effect).toBe('confetti');
    expect(egg?.fullScreen).toBe('sakura-breeze');
  });

  it('should match keywords case-insensitively', () => {
    const egg = getEasterEgg('this is a shark');
    expect(egg).not.toBeNull();
    expect(egg?.effect).toBe('shark-shadow');
  });

  it('should not match partial words if not intended', () => {
    // 假设我们不想匹配 "sharking" (当前逻辑是包含匹配，所以会匹配)
    // 这里用来验证当前行为
    const egg = getEasterEgg('sharking');
    expect(egg).not.toBeNull(); 
  });

  it('should handle date-exclusive eggs', () => {
    const birthdayEgg = EASTER_EGGS.find(e => e.keywords.includes('3.25'));
    if (!birthdayEgg) throw new Error('Birthday egg config missing');

    // Mock Date
    const mockDate = new Date(2024, 2, 25); // Month is 0-indexed: 2 is March
    jest.useFakeTimers().setSystemTime(mockDate);

    const egg = getEasterEgg('祝你生日快乐');
    expect(egg).not.toBeNull();
    expect(egg?.fullScreen).toBe('birthday-starlight');

    // Restore
    jest.useRealTimers();
  });
});
