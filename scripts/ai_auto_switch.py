#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
MiniMax + GLM 自动切换脚本

功能：
1. 支持 MiniMax 和 GLM（智谱）两个模型
2. 自动检测可用性
3. 失败时自动切换到另一个模型
4. 支持健康检查和批量请求

使用方法：
  python scripts/ai_auto_switch.py --test           # 运行测试
  python scripts/ai_auto_switch.py --health         # 健康检查
  python scripts/ai_auto_switch.py --prompt "你好"   # 发送请求
"""

import os
import json
import time
import argparse
from dataclasses import dataclass
from typing import Optional, Literal, Any
from pathlib import Path

# 尝试导入 requests，如果没有则使用 urllib
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    import urllib.request
    import urllib.error
    HAS_REQUESTS = False


# ============================================================
# 配置类
# ============================================================

@dataclass
class MinimaxConfig:
    """MiniMax 配置"""
    api_key: str
    group_id: str
    endpoint: str = "https://api.minimax.chat/v1/text/chatcompletion_v2"
    model: str = "abab6.5-chat"


@dataclass
class GLMConfig:
    """GLM（智谱）配置"""
    api_key: str
    endpoint: str = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
    model: str = "glm-4-plus"


@dataclass
class AIResponse:
    """AI 响应"""
    success: bool
    content: str
    provider: Literal["minimax", "glm"]
    latency_ms: float
    error: Optional[str] = None
    raw_response: Optional[dict] = None


# ============================================================
# 环境变量加载
# ============================================================

def load_env_files() -> dict:
    """
    加载 .env 和 .env.local 文件
    """
    env_vars = {}
    project_root = Path(__file__).parent.parent

    # 优先级：.env.local > .env
    for env_file in [".env", ".env.local"]:
        env_path = project_root / env_file
        if env_path.exists():
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if "=" in line:
                        key, value = line.split("=", 1)
                        # 去除可能的注释
                        value = value.split("#")[0].strip()
                        env_vars[key.strip()] = value

    return env_vars


def get_config() -> tuple[Optional[MinimaxConfig], Optional[GLMConfig]]:
    """
    获取配置
    """
    env = load_env_files()

    minimax_config = None
    glm_config = None

    # MiniMax 配置
    if env.get("MINIMAX_API_KEY") and env.get("MINIMAX_GROUP_ID"):
        minimax_config = MinimaxConfig(
            api_key=env["MINIMAX_API_KEY"],
            group_id=env["MINIMAX_GROUP_ID"],
            endpoint=env.get("MINIMAX_ENDPOINT", "https://api.minimax.chat/v1/text/chatcompletion_v2"),
            model=env.get("MINIMAX_MODEL", "abab6.5-chat"),
        )

    # GLM 配置
    if env.get("ZHIPU_API_KEY") or env.get("GLMS_API_KEY"):
        glm_config = GLMConfig(
            api_key=env.get("ZHIPU_API_KEY") or env.get("GLMS_API_KEY"),
            model=env.get("ZHIPU_MODEL", "glm-4-plus"),
        )

    return minimax_config, glm_config


# ============================================================
# API 调用函数
# ============================================================

def call_minimax(
    config: MinimaxConfig,
    system_prompt: str,
    user_prompt: str,
    timeout: int = 30
) -> AIResponse:
    """
    调用 MiniMax API
    """
    start_time = time.time()

    url = f"{config.endpoint}?GroupId={config.group_id}"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {config.api_key}",
    }
    payload = {
        "model": config.model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.7,
        "max_tokens": 1024,
    }

    try:
        if HAS_REQUESTS:
            response = requests.post(
                url,
                headers=headers,
                json=payload,
                timeout=timeout
            )
            response.raise_for_status()
            data = response.json()
        else:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))

        latency = (time.time() - start_time) * 1000
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")

        if not content:
            return AIResponse(
                success=False,
                content="",
                provider="minimax",
                latency_ms=latency,
                error="响应中没有内容",
                raw_response=data
            )

        return AIResponse(
            success=True,
            content=content,
            provider="minimax",
            latency_ms=latency,
            raw_response=data
        )

    except Exception as e:
        latency = (time.time() - start_time) * 1000
        return AIResponse(
            success=False,
            content="",
            provider="minimax",
            latency_ms=latency,
            error=str(e)
        )


def call_glm(
    config: GLMConfig,
    system_prompt: str,
    user_prompt: str,
    timeout: int = 30
) -> AIResponse:
    """
    调用 GLM（智谱）API
    """
    start_time = time.time()

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {config.api_key}",
    }
    payload = {
        "model": config.model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.7,
        "max_tokens": 1024,
    }

    try:
        if HAS_REQUESTS:
            response = requests.post(
                config.endpoint,
                headers=headers,
                json=payload,
                timeout=timeout
            )
            response.raise_for_status()
            data = response.json()
        else:
            req = urllib.request.Request(
                config.endpoint,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))

        latency = (time.time() - start_time) * 1000
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")

        if not content:
            return AIResponse(
                success=False,
                content="",
                provider="glm",
                latency_ms=latency,
                error="响应中没有内容",
                raw_response=data
            )

        return AIResponse(
            success=True,
            content=content,
            provider="glm",
            latency_ms=latency,
            raw_response=data
        )

    except Exception as e:
        latency = (time.time() - start_time) * 1000
        return AIResponse(
            success=False,
            content="",
            provider="glm",
            latency_ms=latency,
            error=str(e)
        )


# ============================================================
# 自动切换管理器
# ============================================================

class AIAutoSwitch:
    """
    MiniMax + GLM 自动切换管理器

    策略：
    1. 默认使用主 provider（可配置）
    2. 失败时自动切换到备用 provider
    3. 支持健康检查
    4. 记录失败历史，智能选择可用 provider
    """

    def __init__(
        self,
        primary: Literal["minimax", "glm"] = "minimax",
        fallback_enabled: bool = True
    ):
        self.minimax_config, self.glm_config = get_config()
        self.primary = primary
        self.fallback_enabled = fallback_enabled

        # 失败计数
        self._failure_count = {"minimax": 0, "glm": 0}
        self._last_failure_time = {"minimax": 0.0, "glm": 0.0}

        # 冷却时间（秒）- 失败后暂时不使用该 provider
        self._cooldown_seconds = 60

    def _is_in_cooldown(self, provider: str) -> bool:
        """检查 provider 是否在冷却期"""
        if self._failure_count[provider] < 3:
            return False
        elapsed = time.time() - self._last_failure_time[provider]
        return elapsed < self._cooldown_seconds

    def _record_failure(self, provider: str):
        """记录失败"""
        self._failure_count[provider] += 1
        self._last_failure_time[provider] = time.time()

    def _record_success(self, provider: str):
        """记录成功，重置失败计数"""
        self._failure_count[provider] = 0

    def _get_available_providers(self) -> list[str]:
        """获取可用的 provider 列表"""
        providers = []

        if self.minimax_config and not self._is_in_cooldown("minimax"):
            providers.append("minimax")

        if self.glm_config and not self._is_in_cooldown("glm"):
            providers.append("glm")

        # 按优先级排序
        if self.primary in providers:
            providers.remove(self.primary)
            providers.insert(0, self.primary)

        return providers

    def health_check(self) -> dict:
        """
        健康检查 - 测试所有配置的 provider
        """
        results = {
            "minimax": {"available": False, "configured": False, "error": None, "latency_ms": None},
            "glm": {"available": False, "configured": False, "error": None, "latency_ms": None},
        }

        test_prompt = "请说'测试成功'"

        # 测试 MiniMax
        if self.minimax_config:
            results["minimax"]["configured"] = True
            response = call_minimax(
                self.minimax_config,
                "你是一个测试助手。",
                test_prompt,
                timeout=10
            )
            results["minimax"]["available"] = response.success
            results["minimax"]["latency_ms"] = response.latency_ms
            if not response.success:
                results["minimax"]["error"] = response.error

        # 测试 GLM
        if self.glm_config:
            results["glm"]["configured"] = True
            response = call_glm(
                self.glm_config,
                "你是一个测试助手。",
                test_prompt,
                timeout=10
            )
            results["glm"]["available"] = response.success
            results["glm"]["latency_ms"] = response.latency_ms
            if not response.success:
                results["glm"]["error"] = response.error

        return results

    def call(
        self,
        system_prompt: str,
        user_prompt: str,
        preferred_provider: Optional[Literal["minimax", "glm"]] = None,
        timeout: int = 30
    ) -> AIResponse:
        """
        调用 AI API（支持自动切换）

        Args:
            system_prompt: 系统提示词
            user_prompt: 用户提示词
            preferred_provider: 首选 provider（可选）
            timeout: 超时时间（秒）

        Returns:
            AIResponse: AI 响应
        """
        providers = self._get_available_providers()

        if not providers:
            return AIResponse(
                success=False,
                content="",
                provider="minimax",
                latency_ms=0,
                error="没有可用的 AI provider，所有 provider 都在冷却期或未配置"
            )

        # 如果指定了首选 provider，调整优先级
        if preferred_provider and preferred_provider in providers:
            providers.remove(preferred_provider)
            providers.insert(0, preferred_provider)

        last_error = None

        for provider in providers:
            if provider == "minimax" and self.minimax_config:
                response = call_minimax(
                    self.minimax_config,
                    system_prompt,
                    user_prompt,
                    timeout
                )
            elif provider == "glm" and self.glm_config:
                response = call_glm(
                    self.glm_config,
                    system_prompt,
                    user_prompt,
                    timeout
                )
            else:
                continue

            if response.success:
                self._record_success(provider)
                return response
            else:
                self._record_failure(provider)
                last_error = response.error

                if not self.fallback_enabled:
                    return response

                print(f"⚠️  {provider} 调用失败: {response.error}")
                print(f"   尝试切换到下一个 provider...")

        # 所有 provider 都失败
        return AIResponse(
            success=False,
            content="",
            provider=providers[-1] if providers else "minimax",
            latency_ms=0,
            error=f"所有 provider 都失败了。最后的错误: {last_error}"
        )

    def call_for_gallup(
        self,
        confusion: str,
        strengths: list[str],
        scenario: str = "职业发展",
        timeout: int = 60
    ) -> AIResponse:
        """
        为盖洛普优势分析调用 AI

        这是一个便捷方法，使用预设的系统提示词
        """
        system_prompt = """你是一个专业的盖洛普优势分析专家，擅长解读用户的优势组合，
帮助用户理解自己的行为模式和决策偏好。请根据用户提供的优势和困惑，
给出深入的分析和建议。

回复格式要求：
1. 分析用户的优势组合特点
2. 解释当前困惑与优势之间的关系
3. 提供 2-3 条具体的行动建议"""

        user_prompt = f"""我的盖洛普优势：{', '.join(strengths)}

当前场景：{scenario}

我的困惑：{confusion}

请帮我分析并给出建议。"""

        return self.call(system_prompt, user_prompt, timeout=timeout)


# ============================================================
# 命令行接口
# ============================================================

def print_health_check():
    """打印健康检查结果"""
    print("🔍 AI Provider 健康检查")
    print("=" * 60)

    switcher = AIAutoSwitch()
    results = switcher.health_check()

    for provider, info in results.items():
        status = "✅" if info["available"] else ("⚠️" if info["configured"] else "❌")
        print(f"\n{status} {provider.upper()}")
        print(f"   配置状态: {'已配置' if info['configured'] else '未配置'}")

        if info["configured"]:
            print(f"   连接状态: {'正常' if info['available'] else '失败'}")
            if info["latency_ms"]:
                print(f"   延迟: {info['latency_ms']:.0f}ms")
            if info["error"]:
                print(f"   错误: {info['error']}")

    print("\n" + "=" * 60)

    available_count = sum(1 for info in results.values() if info["available"])
    if available_count == 2:
        print("✅ 两个 provider 都可用，自动切换功能正常")
    elif available_count == 1:
        print("⚠️  只有一个 provider 可用，建议检查另一个的配置")
    else:
        print("❌ 没有可用的 provider，请检查 API 配置")


def test_auto_switch():
    """测试自动切换功能"""
    print("🧪 测试 MiniMax + GLM 自动切换")
    print("=" * 60)

    switcher = AIAutoSwitch(primary="minimax")

    # 测试简单对话
    test_cases = [
        ("你是一个友好的助手", "你好！"),
        ("你是盖洛普优势专家", "简单介绍一下'成就'这个优势"),
    ]

    for system, user in test_cases:
        print(f"\n📤 测试请求:")
        print(f"   System: {system[:30]}...")
        print(f"   User: {user}")

        response = switcher.call(system, user, timeout=30)

        if response.success:
            print(f"\n✅ 成功！使用 provider: {response.provider}")
            print(f"   延迟: {response.latency_ms:.0f}ms")
            print(f"   响应预览: {response.content[:100]}...")
        else:
            print(f"\n❌ 失败: {response.error}")

    print("\n" + "=" * 60)
    print("✅ 自动切换测试完成")


def send_prompt(prompt: str, provider: Optional[str] = None):
    """发送提示词"""
    print(f"📤 发送请求...")

    switcher = AIAutoSwitch()

    preferred = None
    if provider in ["minimax", "glm"]:
        preferred = provider

    response = switcher.call(
        "你是一个有帮助的助手。",
        prompt,
        preferred_provider=preferred,
        timeout=30
    )

    if response.success:
        print(f"\n✅ 成功！使用 provider: {response.provider}")
        print(f"延迟: {response.latency_ms:.0f}ms")
        print(f"\n{'─' * 60}")
        print(response.content)
        print(f"{'─' * 60}")
    else:
        print(f"\n❌ 失败: {response.error}")


def main():
    parser = argparse.ArgumentParser(description="MiniMax + GLM 自动切换脚本")
    parser.add_argument("--test", action="store_true", help="运行测试")
    parser.add_argument("--health", action="store_true", help="健康检查")
    parser.add_argument("--prompt", type=str, help="发送提示词")
    parser.add_argument("--provider", type=str, choices=["minimax", "glm"], help="指定 provider")

    args = parser.parse_args()

    if args.health:
        print_health_check()
    elif args.test:
        # 先做健康检查
        print_health_check()
        print("\n")
        test_auto_switch()
    elif args.prompt:
        send_prompt(args.prompt, args.provider)
    else:
        # 默认运行健康检查
        print_health_check()


if __name__ == "__main__":
    main()
