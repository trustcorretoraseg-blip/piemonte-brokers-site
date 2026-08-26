module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({"public": "/"});
  eleventyConfig.addPassthroughCopy({"src/admin": "admin"});

  eleventyConfig.addCollection("portfolio", function(collectionApi) {
    return collectionApi.getFilteredByGlob(["src/imoveis/*.md", "src/areas/*.md"]);
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};