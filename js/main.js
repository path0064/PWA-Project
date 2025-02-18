const token = "";

//IIFE
(async () => {
  console.log("main.js loaded!");
  document
    .getElementById("search-form")
    .addEventListener("submit", handleSearchSubmit);
  // const input = getSearchQuery();
})();

async function fetchMovies(query) {
  let req = new Request(
    `https://api.themoviedb.org/3/search/collection?query=${query}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  let res = await fetch(req)
    .then((res) => {
      if (!res.ok) {
        throw new Error("There was an error fetching the movie");
      }
      return res.json();
    })
    .then((data) => {
      console.log(data);
      return data.results;
    })
    .catch((err) => {
      console.error(err.message);
    });
  if (res) return res;
}

// function getSearchQuery() {
//   let searchField = document.getElementById("search");
//   let url = new URL(location.href);
//   let input = url.searchParams.get("search");
//   if (input) {
//     searchField.value = input;
//   }
//   return input;
// }

async function handleSearchSubmit(ev) {
  console.log("search submitted!");
  ev.preventDefault();
  let search = document.getElementById("search");
  let keyword = search.value;

  let moviesArray = await fetchMovies(keyword);

  createResults(moviesArray);
}

function createResults(moviesArray) {
  console.log(`from createResults: `);
  console.log(moviesArray);
}

//test
