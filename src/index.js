import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import { LazyLoadImage } from "react-lazy-load-image-component";
import './App.css';
import {
    BsSortAlphaDown,
    BsSortAlphaUp,
    BsSortUp,
    BsSortDown,
    BsArrowUpCircle,
} from 'react-icons/bs';
import {
    AiOutlineBarChart
} from 'react-icons/ai'

// Get Data 10 most populated countries
const getPopulatedCountries = (countries) => {
    const listCountries = [...countries];
    listCountries.sort((a, b) => (a.population > b.population) ? -1 : (a.population < b.population) ? 1 : 0);
    return listCountries.map(({ name, population }) => ({ name, total: population })).slice(0, 10);
}

// Get Data 10 most spoken languages
const getSpokenLanguages = (countries) => {
    const result = [];
    const listLanguages = [];
    const worldLanguages = new Set();
    countries.forEach(({ languages }) => {
        for (const { name } of languages) {
            listLanguages.push(name);
            worldLanguages.add(name);
        }
    });
    for (const language of worldLanguages) {
        const countLanguage = listLanguages.filter((item) => item === language).length;
        result.push({ name: language, total: countLanguage });
    }
    result.sort((a, b) => (a.total > b.total) ? -1 : (a.total < b.total) ? 1 : 0);
    return result.slice(0, 10);
}

// Country Component
const Country = ({ country: { name, capital, region, subregion, flag, population, languages, currencies } }) => {
    const formatLanguage = languages.length > 1 ? `Languages` : `Language`;
    if (currencies === undefined) currencies = [{ name: 'N/A' }];
    const formatCurrency = currencies.length > 1 ? `Currencies` : `Currency`;
    return (
        <div className='country-box'>
            <div className='country-flag'>
                <LazyLoadImage src={flag} alt={name} />
            </div>
            <h3 className='country-name'>{name.toUpperCase()}</h3>
            <div className='country-text'>
                <p><span>Capital: </span> {capital}</p>
                <p><span>Region: </span> {region}</p>
                <p><span>Sub Region: </span> {subregion}</p>
                <p><span>Population: </span> {population.toLocaleString()}</p>
                <p><span>{formatLanguage}: </span> {languages.map(language => language.name).join(', ')}</p>
                <p><span>{formatCurrency}: </span> {currencies.map(currency => currency.name).join(', ')}</p>
            </div>
        </div>
    )
}

// CountryStatistics Component
const CountryStatistics = ({ data: { name, total }, totalData }) => {
    const percentage = `${((total / totalData) * 100).toFixed(0)}%`;
    return (
        <div className='statistics-bar'>
            <div className='bar-name'> {name} </div>
            <div className='bar-container'>
                <div className='bar' style={{ width: percentage, height: '30px' }} title={percentage}></div>
            </div>
            <div className='bar-val'>{total.toLocaleString()}</div>
        </div>
    );
}

// App component
const App = () => {
    const initialDataFetch = {
        dataApi: [],
        dataSearch: [],
        querySearch: '',
        errorMessage: '',
    }
    const [dataFetch, setDataFetch] = useState(initialDataFetch);

    const initialSort = {
        nameSort: '',
        populationSort: ''
    }
    const [configSort, setConfigSort] = useState(initialSort);

    const initialTenMost = {
        isTabPopulation: true,
        totalWorldPopulation: 0,
        totalWorldLanguages: 0,
        tenPopulatedCountries: [],
        tenSpokenLanguages: [],
    }
    const [dataTenMost, setDataTenMost] = useState(initialTenMost);
    const { isTabPopulation, totalWorldPopulation, totalWorldLanguages, tenPopulatedCountries, tenSpokenLanguages } = dataTenMost;

    useEffect(() => {
        fetchDataCountry();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchDataCountry = async () => {
        const url = 'https://restcountries.com/v2/all';
        try {
            const response = await axios.get(url)
            const data = await response.data
            setDataFetch({ ...dataFetch, dataApi: data, dataSearch: data });

            const countWorldPopulation = data.reduce((sum, { population }) => {
                if (population === undefined) population = 0;
                return sum + population;
            }, 0);

            const countWorldLanguages = data.reduce((listLanguages, { languages }) => {
                for (const language of languages) {
                    listLanguages.push(language.name);
                }
                return listLanguages;
            }, []).length;

            setDataTenMost(
                {
                    ...dataTenMost,
                    totalWorldPopulation: countWorldPopulation,
                    totalWorldLanguages: countWorldLanguages,
                    tenPopulatedCountries: getPopulatedCountries(data),
                    tenSpokenLanguages: getSpokenLanguages(data)
                }
            );
        } catch (error) {
            setDataFetch({ ...dataFetch, errorMessage: error.message });
        }
    }

    const { dataApi, dataSearch, errorMessage, querySearch } = dataFetch;

    const onChange = (e) => {
        const { value: querySearch } = e.target;

        const dataFilter = (querySearch === '') ? dataApi : dataApi.filter(({ name, capital }) => {
            const searchRegx = new RegExp(querySearch, 'gi')
            return searchRegx.test(name) || searchRegx.test(capital);
        });
        setDataFetch({ ...dataFetch, dataApi, dataSearch: dataFilter, querySearch });

        setDataTenMost({ ...dataTenMost, tenPopulatedCountries: getPopulatedCountries(dataFilter), tenSpokenLanguages: getSpokenLanguages(dataFilter) });
    }

    const nameSortHandler = () => {
        if (configSort.nameSort === 'ASC') {
            const dataSort = dataSearch.sort((a, b) => (a.name > b.name) ? -1 : (a.name < b.name) ? 1 : 0);
            setDataFetch({ ...dataFetch, dataSearch: dataSort });
            setConfigSort({ nameSort: 'DESC', populationSort: '' });
        } else {
            const dataSort = dataSearch.sort((a, b) => (a.name > b.name) ? 1 : (a.name < b.name) ? -1 : 0);
            setDataFetch({ ...dataFetch, dataSearch: dataSort });
            setConfigSort({ nameSort: 'ASC', populationSort: '' });
        }
    }

    const populationSortHandler = () => {
        if (configSort.populationSort === 'ASC') {
            const dataSort = dataSearch.sort((a, b) => (a.population > b.population) ? -1 : (a.population < b.population) ? 1 : 0);
            setDataFetch({ ...dataFetch, dataSearch: dataSort });
            setConfigSort({ dataFetch: '', populationSort: 'DESC' });
        } else {
            const dataSort = dataSearch.sort((a, b) => (a.population > b.population) ? 1 : (a.population < b.population) ? -1 : 0);
            setDataFetch({ ...dataFetch, dataSearch: dataSort });
            setConfigSort({ nameSort: '', populationSort: 'ASC' });
        }
    }
    const { nameSort, populationSort } = configSort;

    const scrollToSection = (sectionId) => {
        const targetSection = document.getElementById(sectionId);
        if (targetSection) targetSection.scrollIntoView({ behavior: "smooth" });
        // eslint-disable-next-line no-restricted-globals
        history.replaceState({}, document.title, window.location.pathname);
    }
    return (
        <div className='app'>
            <div className='country-header' id='header'>
                <h1>World Countries Data</h1>
                <p>Currently, we have {dataApi.length} countries</p>
                {(querySearch && dataSearch.length > 0) && <p className='info-search'>{dataSearch.length} satisfied the search criteria</p>}
            </div>
            <div className='country-search'>
                <input type='text' className='input-search' placeholder='Search countries by name or capital' name='search' onChange={onChange} autoComplete='off'></input>
                <div>
                    Sort :
                    <button className='blue-button' onClick={nameSortHandler}>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                            <span style={{ marginRight: '5px' }}>Name</span>
                            {nameSort === 'ASC' ? <BsSortAlphaDown className='btn-icon' /> : nameSort === 'DESC' ? <BsSortAlphaUp className='btn-icon' /> : ''}
                        </div>
                    </button>
                    <button className='blue-button' onClick={populationSortHandler}>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                            <span style={{ marginRight: '5px' }}>Population</span>
                            {populationSort === 'ASC' ? <BsSortUp className='btn-icon' /> : populationSort === 'DESC' ? <BsSortDown className='btn-icon' /> : ''}
                        </div>
                    </button>|
                    <button className='blue-button' onClick={() => scrollToSection('statistics')} >
                        <div style={{ display: "flex", justifyContent: "center" }}>
                            <span style={{ marginRight: '5px' }}>Statistics</span>
                            <AiOutlineBarChart className='btn-icon' />
                        </div>
                    </button>
                </div>
            </div>
            <div className='country-container'>
                {(dataApi.length > 0 && dataSearch.length > 0)
                    ? dataSearch.map((country) => (
                        <Country country={country} key={country.name} />
                    ))
                    : (dataApi.length > 0 && dataSearch.length === 0)
                        ? <div className='error-message'>No result found.</div>
                        : <div className='error-message'>{errorMessage ? errorMessage : 'Retrieving data, please wait a few seconds.'}</div>}
            </div>
            {
                dataSearch.length > 0 &&
                (
                    <div className='country-statistics' id="statistics">
                        <button className='blue-button' onClick={() => setDataTenMost({ ...dataTenMost, isTabPopulation: true })}>POPULATION</button>
                        <button className='blue-button' onClick={() => setDataTenMost({ ...dataTenMost, isTabPopulation: false })}>LANGUAGES</button>
                        {(isTabPopulation)
                            ?
                            (
                                <div>
                                    <h4>10 Most populated countries in the world </h4>
                                    <CountryStatistics data={{ name: 'World', total: totalWorldPopulation }} totalData={totalWorldPopulation} />
                                    {tenPopulatedCountries.map((item) => <CountryStatistics data={item} totalData={totalWorldPopulation} key={item.name} />)}
                                </div>
                            )
                            :
                            (
                                <div>
                                    <h4>10 Most spoken languages in the world</h4>
                                    <CountryStatistics data={{ name: 'All Languages', total: totalWorldLanguages }} totalData={totalWorldLanguages} />
                                    {tenSpokenLanguages.map((item) => <CountryStatistics data={item} totalData={totalWorldLanguages} key={item.name} />)}
                                </div>
                            )
                        }
                    </div>
                )
            }
            <div className='country-footer'>
                <div className='btn-up'>
                    <button className='blue-button' onClick={() => scrollToSection('header')} style={{ padding: '5px 10px' }} title='Back to Top'>
                        <BsArrowUpCircle className='btn-icon-up' />
                    </button>
                </div>
                <p>Made with <span style={{ color: '#ff5a5a' }}>❤</span> by <a href='https://github.com/fujianto21' target='_blank' rel='noreferrer'>Fujianto</a></p>
                <p style={{ fontSize: '15px' }}>GitHub repository : <a href='https://github.com/fujianto21/world-countries-data' target='_blank' rel='noreferrer'>https://github.com/fujianto21/world-countries-data</a></p>
            </div>
        </div >
    );
}

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<App />);