# Day Trading Fundamentals

> Day trading is the practice of buying and selling financial instruments within a single day, using price charts, technical indicators, and risk management strategies to find profitable opportunities.

## Diagram

```mermaid
flowchart TB
  classDef concept fill:#4A90A4,stroke:#2C5F6E,stroke-width:2px,color:#fff
  classDef process fill:#7B68A6,stroke:#4A3D6E,stroke-width:2px,color:#fff
  classDef example fill:#5DAE8B,stroke:#3D7A5E,stroke-width:2px,color:#fff
  classDef analogy fill:#D4A574,stroke:#A67B4A,stroke-width:2px,color:#fff
  n1(Day Trading)
  n2(Price Charts)
  n3(Orders)
  n4(Technical Indicators)
  n5(Risk Management)
  n6(Hedging)
  n7(Candlestick)
  n8(Support & Resistance)
  n9(Volume)
  n10[Market Order]
  n11[Limit Order]
  n12[Stop-Loss Order]
  n13(Moving Average (MA))
  n14[/MA Crossover Strategy/]
  n15(RSI (Relative Strength Index))
  n16[Position Sizing]
  n17(Risk/Reward Ratio)
  n18(Long vs Short)
  n19[/Candle Patterns/]
  class n1,n2,n3,n4,n5,n6,n7,n8,n9,n13,n15,n17,n18 concept
  class n10,n11,n12,n16 process
  class n14,n19 example
  n7 ==>|forms patterns at| n8
  n9 ---|confirms signals from| n7
  n8 ==>|triggers placement of| n11
  n13 ---|combined with| n8
  n15 ---|used alongside| n13
  n4 ==>|generates signals that trigger| n3
  n12 -->|defines the risk side of| n17
  n16 ==>|sets size before placing| n12
  n18 -->|is the mechanism of| n6
  n6 -->|is a tool of| n5
  n2 ==>|feeds data into| n4

  subgraph Legend
    L1(Concept):::concept
    L2[Process]:::process
    L3[/Example/]:::example
    L4{{Analogy}}:::analogy
  end
```

## Concepts

- **Day Trading** [Concept]
  _Buying and selling assets within the same trading day, aiming to profit from short-term price movements_
  - **Price Charts** [Concept]
    _Visual representations of an asset's price over time — the trader's primary tool for reading the market_
    - **Candlestick** [Concept]
      _A single candle shows Open, High, Low, Close for a time period. Body = open-to-close range, Wick = high/low extremes. Green = price rose, Red = price fell_
      - **Candle Patterns** [Example]
        _Multi-candle formations that signal reversals or continuation: Doji (indecision), Hammer (bullish reversal), Engulfing (strong reversal)_
    - **Support & Resistance** [Concept]
      _Price levels where buying (support) or selling (resistance) historically concentrate, acting as floors and ceilings_
    - **Volume** [Concept]
      _Number of shares/contracts traded in a period. High volume confirms a move; low volume = weak signal_
  - **Orders** [Concept]
    _Instructions sent to a broker to buy or sell an asset at specified conditions_
    - **Market Order** [Process]
      _Buy or sell immediately at the best available price — fast but no price guarantee_
    - **Limit Order** [Process]
      _Buy or sell only at a specified price or better — gives price control but may not fill_
    - **Stop-Loss Order** [Process]
      _Automatically sells if price falls to a set level — your safety net that caps the maximum loss on a trade_
  - **Technical Indicators** [Concept]
    _Mathematical calculations applied to price/volume data to surface trends and signals_
    - **Moving Average (MA)** [Concept]
      _Average closing price over N periods, updated each bar. Smooths out noise to reveal the trend direction_
      - **MA Crossover Strategy** [Example]
        _When a fast MA (e.g., 9-period) crosses above a slow MA (e.g., 21-period) = buy signal. Cross below = sell signal_
    - **RSI (Relative Strength Index)** [Concept]
      _Oscillator from 0-100. Above 70 = overbought (potential reversal down). Below 30 = oversold (potential reversal up)_
  - **Risk Management** [Concept]
    _Strategies to limit losses and protect capital — the difference between longevity and blowing up an account_
    - **Position Sizing** [Process]
      _Only risk a fixed % of capital per trade (e.g., 1-2%). Prevents one bad trade from wiping the account_
    - **Risk/Reward Ratio** [Concept]
      _Compare potential profit to potential loss. A 1:2 ratio means risking $1 to make $2 — only take trades where reward justifies the risk_
  - **Hedging** [Concept]
    _Taking an offsetting position to reduce exposure to an existing trade's risk_
    - **Long vs Short** [Concept]
      _Long = buy first, profit if price rises. Short = borrow and sell first, profit if price falls — lets traders profit in both directions_

## Relationships

- **Candlestick** → *forms patterns at* → **Support & Resistance**
- **Volume** → *confirms signals from* → **Candlestick**
- **Support & Resistance** → *triggers placement of* → **Limit Order**
- **Moving Average (MA)** → *combined with* → **Support & Resistance**
- **RSI (Relative Strength Index)** → *used alongside* → **Moving Average (MA)**
- **Technical Indicators** → *generates signals that trigger* → **Orders**
- **Stop-Loss Order** → *defines the risk side of* → **Risk/Reward Ratio**
- **Position Sizing** → *sets size before placing* → **Stop-Loss Order**
- **Long vs Short** → *is the mechanism of* → **Hedging**
- **Hedging** → *is a tool of* → **Risk Management**
- **Price Charts** → *feeds data into* → **Technical Indicators**

## Real-World Analogies

### Candlestick ↔ A weather report for price

Just as a weather report tells you the high, low, and average temperature for a day, a candle tells you the high, low, open, and close for a time period. The color tells you whether the 'day' ended warmer (green) or cooler (red) than it started. Patterns of candles are like weather fronts — multiple days of data forming a forecast.

### Moving Average ↔ A car's speedometer vs. GPS average speed

Moment-to-moment price is like your speedometer — jumpy and noisy. A moving average is like the GPS average speed — smoothed over time to show your true trend. A fast MA (short window) reacts quickly like a speedometer; a slow MA (long window) shows the bigger trend. When they cross, it's like your speed consistently changing direction.

### Stop-Loss ↔ A circuit breaker in your house

A circuit breaker automatically cuts power when current exceeds a safe level — you don't have to watch the wires and decide in the moment. A stop-loss does the same for a trade: it automatically exits the position if price drops to a pre-set level, removing emotion from the decision and capping your worst-case loss before it spirals.

---
*Generated on 2026-03-20*