# Oval: Demo

**Link to demo**: https://maanasarora.github.io/oval-demo/

**Library repo**: https://github.com/MaanasArora/oval 

## Description

Oval is a tool for the analysis of [Pol.is](https://pol.is/)-like data using human-annotated labels.

Pol.is provides tools to understand crowdsourced opinion data (participant-provided comments and votes on these comments). It can extract points of consensus and divergence and identify major groups of participants based on voting patterns. These data can be hard to interpret: points of disagreement are described by the comments that produced them, and groups are described by their voting patterns on comments. (See https://patcon.github.io/valency-anndata/ for further reading.)

Oval adds a layer on top of this analysis. To investigate a Pol.is conversation, experts and analysts can define a variable (value or inclination) of interest that varies by participants. Then they find "proxy" comments that represent this value (or its antithesis) particularly well ("anchors"). Oval can use these annotated anchors to approximate this value over all comments and participants. Of course, as only vote structure is used, these values can only be reliably approximated as far as the coalition structure of the conversation (voting patterns) represent them.

This work is being actively investigated. Check back later for more insights!

## How to use

1. Import a Pol.is conversation.
   - Download a Pol.is conversation archive from its report page. In particular, download the `participant-votes.csv` and `comments.csv`.
   - Use the buttons on the left-hand side of this demo to import these files.
2. Define a variable of interest.
   - This can be a value or a general inclination that is measured across participants.
3. Find anchors.
   - Use the dataset view on the left-hand side to search or explore relevant 'proxy' comments, and select them.
4. Rate anchors.
   - Rate the relevant comments from -2 to 2. (-2: very low, 2: very high)
5. Compute the variable and explore scores.

## Contributing

This repo is open to contributions! If you are interested in this space, please consider introducing yourself in the Discussions.
