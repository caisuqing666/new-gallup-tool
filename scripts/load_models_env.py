from dotenv import load_dotenv
from pathlib import Path
import os


def load_model_config():
    env_local = Path(".env.local")
    env_default = Path(".env")
    if env_local.exists():
        load_dotenv(env_local)
    if env_default.exists():
        load_dotenv(env_default)

    glm_config = {
        "api_key": os.getenv("ZHIPU_API_KEY") or os.getenv("GLMS_API_KEY"),
        "model": os.getenv("ZHIPU_MODEL", "glm-4-plus"),
    }

    minimax_config = {
        "api_key": os.getenv("MINIMAX_API_KEY"),
        "group_id": os.getenv("MINIMAX_GROUP_ID"),
        "model": os.getenv("MINIMAX_MODEL", "abab6.5-chat"),
        "endpoint": os.getenv(
            "MINIMAX_ENDPOINT",
            "https://api.minimax.chat/v1/text/chatcompletion_v2",
        ),
    }

    return glm_config, minimax_config


if __name__ == "__main__":
    glm, minimax = load_model_config()

    if not glm["api_key"]:
        print("未检测到 GLM API Key（将跳过 GLM 校验）")

    if not minimax["api_key"] or not minimax["group_id"]:
        raise RuntimeError("缺少 MiniMax 配置，请在 .env 中设置 MINIMAX_API_KEY 和 MINIMAX_GROUP_ID")

    if glm["api_key"]:
        print("GLM 配置已加载:", {"model": glm["model"]})
    print("MiniMax 配置已加载:", {"model": minimax["model"], "endpoint": minimax["endpoint"]})
