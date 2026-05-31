# Project: Algorithmic Trading Agent (research / paper-trading)
Shay built a Telegram-controlled trading agent in Python (SQLAlchemy,
PostgreSQL, CCXT, Docker) with a signal engine that combines EMA, RSI, and MACD
into weighted scores. It includes a full paper-trading engine with slippage,
fees, ATR-based stops, and an automated risk layer (loss limits, drawdown
auto-stop, cooldowns). It runs in demo/paper mode only - it is a research
project, not live trading.
