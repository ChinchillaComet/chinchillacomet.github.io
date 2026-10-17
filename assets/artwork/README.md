# Artwork sources

These scene illustrations were created with the built-in ImageGen tool for this welcome page. The generated artwork contains no lettering; the website adds the licensed, exact bitmap glyphs separately.

The large working renders were sampled onto deliberate base grids with nearest-neighbour canvas rendering and encoded at WebP quality 95. These compact assets are the only scene images delivered to visitors. The rendered page was reviewed again after optimization to check blossom, cloud, mountain and water detail.

| Asset | Working render | Delivered grid | Bytes |
| --- | --- | --- | ---: |
| landscape.webp | 1536 × 1024 | 768 × 512 | 262778 |
| portrait.webp | 887 × 1774 | 444 × 888 | 286126 |
| panorama.webp | 1912 × 823 | 956 × 412 | 272134 |

Portrait and panorama were generated using the selected landscape as a style and scene reference. The prompts requested larger working dimensions; the website uses the smaller grids above. Its final canvas is enlarged by a whole number of physical display pixels with smoothing disabled.

## Prompts

### Landscape

Use case: stylized-concept.
Asset type: final background illustration for a beautiful full-screen animated pixel-art welcome page, no typography.

Create an exquisite, richly detailed, professional ANIME PIXEL ART environment: a peaceful cherry-blossom garden looking across a glassy mountain lake at blue-purple twilight. The craft and atmosphere of a lovingly polished Japanese pixel-art adventure game background. Landscape composition, 3:2, 1536 by 1024 pixels.

Composition: a gracefully curving dark cherry tree rises from the lower-left foreground, its large luminous pink blossom canopy framing the upper-left corner and reaching just into the top edge. The trunk and branching limbs are organic, continuous, clearly articulated, beautifully shaded; the blossom canopy has densely drawn, carefully clustered individual flowers and tiny leaves, not flat slabs. A smaller cherry bough frames the far upper-right edge. At the bottom, intricate mossy stones, grasses, tiny flowers, and a single small warm amber garden lantern at the left shore. Richly layered lavender and blue mountain silhouettes and tiny distant conifers along the opposite shore. Across the lower third, a luminous blue-violet lake with finely drawn horizontal reflections of the moon, clouds, pink blossoms and mountains, ripples changing size with perspective, dark teal nearshore water and a few drifting petals. The lake must feel like reflective water, full of careful light and detail.

The sky is spacious and poetic: deep indigo above fading through lavender to a warm apricot twilight glow at the distant horizon, a slender luminous crescent moon high right of centre, sparse tiny pixel stars, and several magnificent softly billowing peach-lilac clouds with detailed round volumes, subtle shaded undersides, and natural ragged pixel contours. Clouds have whole natural silhouettes, not rectangular crops. Place distant mountain horizon around 60 percent of the image height; keep the central area from x=33 to 68 percent and y=39 to 54 percent calm, relatively dark lavender sky so a short word can be overlaid there later. This calm area still has subtle sky color, small stars, atmospheric depth. Let the tree frame the view without blocking that central area. No black voids.

Pixel-art technique is crucial: true, clean, deliberate square pixels on one consistent fine pixel grid, like a 768x512 artwork displayed at exactly 2x using nearest neighbour. Crisp clustered shading, elegant controlled stair-step contours, beautiful hue-shifted light and shadow, strong coherent silhouettes, meticulous small details where forms need them. Rich harmonious palette of periwinkle, indigo, dusty rose, warm peach highlights and cool teal shadows. Thoughtful light and shadow define forms. Native pixel art, not a painted illustration with a mosaic filter. Not low-detail blocks: blossoms, bark, moss, mountains and reflections must be lovingly resolved.

Mood: tranquil, cinematic, magical, inviting, breathtakingly beautiful, like pausing in a gorgeous anime game at dusk.
No text, no letters, no symbols resembling writing, no interface, no logo, no watermark, no people, no shooting star (we will animate one in code).
Avoid triangular holes or angular bites in foliage, crude polygon trees, geometric cloud slabs, randomly scattered block noise, flat empty backgrounds, excessive dithering, checkerboard texture, blur, smooth vector shapes, anti-aliased curves, photorealism, thick outlines.

### Portrait

Use case: stylized-concept.
Asset type: companion mobile portrait background for the same pixel-art welcome website.
Input image 1 is a STYLE AND SCENE REFERENCE. Create a newly composed vertical portrait version of this exact beautiful cherry blossom twilight world, 1024 pixels wide by 2048 pixels high. Preserve the high quality, colors, intricate anime pixel-art craft, rich water, mountains, moon, natural cherry tree and tiny warm lantern. Recompose intentionally for portrait rather than cropping away all the important features.

Composition: large organic cherry tree trunk and luminous pink flower-covered boughs frame the LEFT EDGE, beginning near the lower-left lakeshore and arching into the upper-left third. Fine blossoms and branches across part of the top, never blocking the central view. A slender crescent moon in the upper-right third; beautifully voluminous sunset peach and lavender clouds further back across the upper third and near the horizon. Calm dark periwinkle sky through the EXACT CENTRE of the whole image, x=22 to 78 percent, y=43 to 54 percent, for a short centered word that will be added as real text later. Put the distant layered mountain peaks below the central lettering region, around y=58 percent, lake shore at y=67 percent. A richly reflective luminous twilight lake fills the lower third, with detailed calm ripples, gold moonlight, peach clouds reflected in deep blue water, mossy stones and delicate flower-covered grasses around the near edges, one warm small traditional garden lantern near the lower-left edge. The distant shore may have a few tiny warm lights as in the reference, but keep the scene peaceful. Visual depth, exquisite blossoms and bark, correct continuous natural tree silhouettes, small resolved flora, painterly ANIME atmosphere executed as actual PIXEL ART.

Pixel technique: visible clean square pixels on one consistent FINE pixel grid, like artwork designed at 512x1024 and exactly doubled with nearest-neighbour scaling. All edges and highlights share that grid. Deliberate clustered pixel shapes, purposeful stair steps, hue-shifted pixel shading. This is a professionally crafted pixel-art game background, not vector shapes or a smooth digital painting under a mosaic filter. Preserve and recompose the reference's exceptionally rich detail and magical atmosphere.
Constraints: no text, no letters, no logo, no watermark, no UI, no people, no shooting star. No triangular gaps cut from the tree canopy, no crude blocky clouds, no random colored blocks, no bleak blank background, no blur. Make a beautiful cohesive PORTRAIT illustration, keeping the centre quiet and readable.

### Panorama

Use case: stylized-concept.
Asset type: ultra-wide companion illustration for the same animated anime pixel-art landing page.
Image 1 is the style and scene reference. Recompose this same exquisite, detailed cherry-blossom mountain lake at twilight as a panoramic 21:9 environment, 2304 pixels wide by 992 pixels high. It must have the reference's fine, crisp pixel art craftsmanship, gorgeous lighting and coherent forms. This is a new panoramic composition, not a crop that chops off the moon, tree or lake.

An organic pink cherry tree frames the left side, with a beautifully shaded curving trunk visible from the mossy left lakeshore and a finely detailed mass of blossoms arching across the upper-left edge. A few thin blossom-covered branches on the far right. A crescent moon remains fully visible in the upper-right portion of the open sky around x=72%, y=22%, comfortably away from image edges. Billowing detailed peach and lavender twilight clouds on both sides of a quiet dark periwinkle central sky. Distant layered blue and purple mountains rise along a low horizon, highest side peaks around 48% down, the lake shore about 64% down. Keep x=39–61%, y=42–56% relatively calm for a small word overlay added later. The lower third must include ample richly reflective lake, fine perspective ripples and warm cloud, moon and lantern reflections, with detailed mossy foreground stones and grasses at the lower corners, and one small warm amber garden lantern at lower left. Tiny distant conifers and warm lights along the far shore. Keep the broad centre unobstructed and welcoming.

True ANIME PIXEL ART style: very fine consistent square pixel grid, deliberate clean pixel clusters, natural expressive stair-step silhouettes, controlled hue-shifted shading, beautifully resolved blossoms, bark, plants, mountains, clouds and water. Same rich indigo, periwinkle, peach, pink and cool teal palette. Every detail is purposeful, never random colored blocks. Magical calm, elegant cinematic atmosphere, production-quality game environment.
No text, no letters, no logo, no watermark, no UI, no people, no shooting star.
Avoid coarse polygons, triangular canopy holes, clipped cloud silhouettes, flat lifeless water, blur, excessive dithering, vector artwork, a smooth painting with a mosaic filter.
