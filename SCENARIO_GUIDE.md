# Sustain-Tech Scenario Guide: November/December 2026 Crisis

This guide outlines the dynamic, live-disaster scenarios built for the Sustain-Tech simulation engine, modeled on the extreme weather patterns projected for late 2026 (a severe North-East Monsoon collision with localized droughts). 

## The Narrative Flow

The game breaks away from rigid turn limits. The progression branches based on the decisions made by the player, represented by buckets.

### Bucket 1 (Day 0): "The Gathering Storm"
- **Situation:** The Department of Meteorology detects an unprecedented depression forming in the Bay of Bengal. Meanwhile, the dry zone reservoirs are at a historic low for November.
- **Variables at Play:** Initial Water Reserves drop slightly.
- **Actions:** Players focus on early intelligence gathering (inspecting water sources, deploying drones) or pre-emptive hoarding (purchasing emergency supplies). 

### Bucket 2 (Day 2): "The First Hit"
- **Situation:** Heavy rainfall batters the Eastern province, but completely misses the drought-stricken North-Central province. 
- **Variables at Play:** Rainfall spikes locally, but national Water Demand increases due to panic. 
- **Actions:** You must choose whether to trust unofficial social media reports, spend early budget, or establish local monitoring stations.

### Bucket 3 (Day 4): "The Communications Blackout"
- **Situation:** High winds have toppled cellular towers in the East. You have a fixed budget (e.g., LKR 100M) and must decide how to split it between repairing comms, sending bowsers to the dry zone, and medical triage.
- **Variables at Play:** Communications grid visually glitches and goes offline if ignored.
- **Actions:** Budget allocation sliders. Overspending forces foreign aid reliance.

### Bucket 4 (Day 6): "The Spill"
- **Situation:** The major reservoirs (e.g., Victoria, Randenigala) reach spill levels. 
- **Variables at Play:** The animated Water Tank visually overflows. 
- **Actions:** Logistics allocation. Diverting the 50 available Army trucks between flood rescue and dry-zone water delivery.

### Bucket 5 (Day 8): "The Contamination"
- **Situation:** Flooded areas report rising Dengue and Cholera cases due to stagnant water. The dry zone reports complete crop failure for the Maha season.
- **Variables at Play:** Disease risks spike. 
- **Actions:** Medical triage vs. Infrastructure repair. 

### Bucket 6+ (Day 10 - Day 14): "The Recovery"
- **Situation:** The storm passes. The focus shifts entirely to rebuilding. 
- **Variables at Play:** Final calculation of the CPS (Composite Preparedness Score) using an asymptotic curve so achieving 100 requires absolute perfection over the campaign.
- **Actions:** Deploying recovery funds, declaring national mourning, or rationing.

## Visual UI Integration
- **Animated Water Reserves:** A visual tank component tracks `state.environment.rainfall` and `state.resources.drinkingWater`. If rainfall spikes without adequate capacity, the tank overflows (red flash). 
- **Communications Grid:** A map-like node network. Actions that neglect information quality cause nodes to turn red and "glitch" out using CSS/Framer Motion.
- **Resource Sliders:** Used during Bucket 3 and 4 to simulate intense calculation-based decisions.
