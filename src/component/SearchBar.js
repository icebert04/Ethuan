const SearchBar = () => {
    return (
        <header>
            <h2 className="headerTitle">Search it. Tour it. Buy it.</h2>
            <input
                type="text"
                className="headerSearch"
                placeholder="Enter an address, town, city, or ZIP code"
            />
        </header>
    );
}

export default SearchBar;