(() => {
  if (typeof d3 === "undefined") {
    return;
  }

  const svg = d3.select("#nj-map");
  if (svg.empty()) {
    return;
  }

  const tooltip = d3.select("#nj-map-tooltip");
  const summary = d3.select("#nj-map-summary");

  const candidates = [
    {
      id: "a",
      name: "Rodolfo A Jaramillo",
      pct: 23,
      votes: 230,
    },
    {
      id: "b",
      name: "Manashvi Vats",
      pct: 23,
      votes: 230,
    },
    {
      id: "c",
      name: "Dedeepya Nallamothu",
      pct: 54,
      votes: 540,
    },
  ];

  const weightedPick = () => {
    const roll = Math.random();
    if (roll < 0.65) {
      return candidates[2];
    }
    if (roll < 0.825) {
      return candidates[0];
    }
    return candidates[1];
  };

  const geoUrl =
    "https://services2.arcgis.com/XVOqAjTOJ5P6ngMu/arcgis/rest/services/NJ_Municipal_Boundaries_3424/FeatureServer/0/query" +
    "?where=COUNTY%3D%27MERCER%27" +
    "&outFields=NAME,MUN_LABEL,MUN_TYPE,COUNTY,CENSUS2020,MUN_CODE" +
    "&outSR=4326" +
    "&f=geojson";

  const width = 320;
  const height = 420;

  svg.attr("viewBox", `0 0 ${width} ${height}`);

  const mapCard = svg.node().closest(".map-card");

  const getMunicipalityLabel = (feature) => {
    const props = feature?.properties || {};
    if (props.MUN_LABEL) {
      return props.MUN_LABEL;
    }
    if (props.NAME && props.MUN_TYPE) {
      return `${props.NAME} ${props.MUN_TYPE}`;
    }
    return props.NAME || "Municipality";
  };

  const positionTooltip = (x, y) => {
    if (!mapCard || tooltip.empty()) {
      return;
    }
    const rect = mapCard.getBoundingClientRect();
    const maxLeft = rect.width - 170;
    const maxTop = rect.height - 70;
    const left = Math.min(Math.max(x - rect.left + 12, 12), maxLeft);
    const top = Math.min(Math.max(y - rect.top + 12, 12), maxTop);

    tooltip
      .style("left", `${left}px`)
      .style("top", `${top}px`)
      .style("opacity", 1);
  };

  const updateTooltip = (event, feature, fallbackElement) => {
    const name = getMunicipalityLabel(feature);
    const winner = feature?.properties?._winner;
    const winnerText = winner
      ? `${winner.name} (${winner.pct.toFixed(0)}%)`
      : "No votes yet";

    if (!tooltip.empty()) {
      tooltip.html(
        `<div class="tooltip-title">${name}</div>` +
          `<div class="tooltip-value">${winnerText}</div>`
      );
    }

    let clientX = event?.clientX;
    let clientY = event?.clientY;

    if ((!clientX || !clientY) && fallbackElement) {
      const bounds = fallbackElement.getBoundingClientRect();
      clientX = bounds.left + bounds.width / 2;
      clientY = bounds.top + bounds.height / 2;
    }

    if (clientX && clientY) {
      positionTooltip(clientX, clientY);
    }
  };

  const hideTooltip = () => {
    if (!tooltip.empty()) {
      tooltip.style("opacity", 0);
    }
  };

  const setActive = (element) => {
    svg.selectAll(".nj-town").classed("is-active", false);
    if (element) {
      d3.select(element).classed("is-active", true);
    }
  };

  d3.json(geoUrl)
    .then((collection) => {
      if (!collection || !Array.isArray(collection.features)) {
        if (!summary.empty()) {
          summary.text("Map data not found.");
        }
        return;
      }

      if (collection.features.length === 0) {
        if (!summary.empty()) {
          summary.text("No municipalities found.");
        }
        return;
      }

      const projection = d3.geoMercator().fitSize([width, height], collection);
      const path = d3.geoPath(projection);

      svg.selectAll("*").remove();

      const towns = svg
        .append("g")
        .attr("class", "nj-towns")
        .selectAll("path")
        .data(
          collection.features.map((feature) => {
            const winner = weightedPick();
            return {
              ...feature,
              properties: {
                ...feature.properties,
                _winner: winner,
              },
            };
          })
        )
        .join("path")
        .attr("class", (d) => `nj-town candidate-${d.properties?._winner?.id || ""}`)
        .attr("d", path)
        .attr("data-id", (d) =>
          String(d.properties?.CENSUS2020 || d.properties?.MUN_CODE || "")
        )
        .attr("data-name", (d) => getMunicipalityLabel(d))
        .attr("tabindex", 0)
        .attr("role", "img")
        .attr("aria-label", (d) => {
          const winner = d.properties?._winner;
          const winnerText = winner
            ? `${winner.name} ${winner.pct.toFixed(0)}%`
            : "no votes yet";
          return `${getMunicipalityLabel(d)}: ${winnerText}`;
        })
        .on("mouseenter", function (event, d) {
          setActive(this);
          updateTooltip(event, d, this);
        })
        .on("mousemove", function (event, d) {
          updateTooltip(event, d, this);
        })
        .on("mouseleave", () => {
          setActive(null);
          hideTooltip();
        })
        .on("focus", function (event, d) {
          setActive(this);
          updateTooltip(event, d, this);
        })
        .on("blur", () => {
          setActive(null);
          hideTooltip();
        });

      towns.append("title").text((d) => {
        const winner = d.properties?._winner;
        const winnerText = winner
          ? `${winner.name} ${winner.pct.toFixed(0)}%`
          : "no votes yet";
        return `${getMunicipalityLabel(d)}: ${winnerText}`;
      });

      if (!summary.empty()) {
        summary.text("Live results: Dedeepya Nallamothu 54%, others 23% each.");
      }
    })
    .catch((error) => {
      console.error("Failed to load map data", error);
      if (!summary.empty()) {
        summary.text("Map data failed to load.");
      }
    });
})();
