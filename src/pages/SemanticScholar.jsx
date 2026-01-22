import React, { useState, useEffect } from 'react';

// === HELPER COMPONENTS ===

const StatBadge = ({ icon, label, value, colorClass = "bg-blue-100 text-blue-700" }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} mr-2`}>
        {icon && <span className="mr-1">{icon}</span>}
        {label}: {value}
    </span>
);

const PaperCard = ({ paper, onClick }) => {
    return (
        <div
            onClick={() => onClick(paper)}
            className="cursor-pointer group relative bg-white/80 backdrop-blur-sm border border-white/20 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl p-6 overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {paper.title}
                </h3>
            </div>
            {paper.openAccessPdf?.url && (
                <div className="mb-2">
                    <a
                        href={paper.openAccessPdf.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded hover:bg-green-100 transition-colors border border-green-200"
                    >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        Download PDF
                    </a>
                </div>
            )}

            <div className="text-sm text-gray-500 mb-3 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-gray-700">{paper.year || 'N/A'}</span>
                {paper.venue && <span>• {paper.venue}</span>}
                {paper.authors && paper.authors.length > 0 && (
                    <span>• {paper.authors.map(a => a.name).slice(0, 2).join(', ')}{paper.authors.length > 2 ? ' et al.' : ''}</span>
                )}
            </div>

            {paper.abstract && (
                <p className="text-gray-600 text-sm line-clamp-3 mb-4 font-light">
                    {paper.abstract}
                </p>
            )}

            <div className="flex items-center mt-auto pt-4 border-t border-gray-100">
                <StatBadge label="Citations" value={paper.citationCount ?? 0} colorClass="bg-purple-100 text-purple-700" />
                <StatBadge label="Refs" value={paper.referenceCount ?? 0} colorClass="bg-indigo-100 text-indigo-700" />
            </div>
        </div>
    );
};

const AuthorCard = ({ author, onClick }) => (
    <div
        onClick={() => onClick(author)}
        className="cursor-pointer group relative bg-white/80 backdrop-blur-sm border border-white/20 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl p-6 flex flex-col items-center text-center"
    >
        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg">
            {author.name.charAt(0)}
        </div>
        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
            {author.name}
        </h3>
        {author.affiliations && author.affiliations.length > 0 && (
            <p className="text-xs text-gray-500 mb-3 line-clamp-1">{author.affiliations[0]}</p>
        )}

        <div className="flex gap-2">
            <StatBadge label="Papers" value={author.paperCount ?? 0} />
            <StatBadge label="Citations" value={author.citationCount ?? 0} colorClass="bg-purple-100 text-purple-700" />
        </div>
    </div>
);

// === MAIN COMPONENT ===

function SemanticScholar() {
    // Tabs: 'papers' | 'authors'
    const [activeTab, setActiveTab] = useState('papers');

    // Search State
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filters
    const [yearStart, setYearStart] = useState('');
    const [yearEnd, setYearEnd] = useState('');
    const [selectedField, setSelectedField] = useState('');
    const [openAccess, setOpenAccess] = useState(false);
    const [fieldsList, setFieldsList] = useState([]);

    // Detail View State
    const [selectedPaper, setSelectedPaper] = useState(null);
    const [paperDetails, setPaperDetails] = useState(null); // Full details incl citations
    const [citations, setCitations] = useState([]); // Forward citations
    const [references, setReferences] = useState([]); // Backward references

    const [selectedAuthor, setSelectedAuthor] = useState(null);
    const [authorDetails, setAuthorDetails] = useState(null);

    // Load fields of study on mount
    useEffect(() => {
        fetch('http://localhost:4000/api/semantic/fields')
            .then(r => r.json())
            .then(d => {
                if (d.data) setFieldsList(d.data);
            })
            .catch(console.error);
    }, []);

    // Handlers
    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setResults([]);
        setError(null);

        try {
            let endpoint = '';
            if (activeTab === 'papers') {
                const yearRange = (yearStart || yearEnd) ? `${yearStart || ''}-${yearEnd || ''}` : '';
                const params = new URLSearchParams({
                    query,
                    limit: 10,
                    openAccessPdf: openAccess
                });
                if (yearRange && yearRange !== '-') params.set('year', yearRange);
                if (selectedField) params.set('fieldsOfStudy', selectedField);

                endpoint = `http://localhost:4000/api/semantic/search?${params.toString()}`;
            } else {
                const params = new URLSearchParams({ query, limit: 10 });
                endpoint = `http://localhost:4000/api/semantic/author/search?${params.toString()}`;
            }

            const res = await fetch(endpoint);
            const data = await res.json();

            if (!res.ok) {
                // Handle 429 specifically or general errors
                if (res.status === 429) {
                    throw new Error("Rate limit exceeded. Please try again later or add an API key.");
                }
                throw new Error(data.error || `Error ${res.status}`);
            }

            if (data.data) {
                setResults(data.data);
            } else {
                setResults([]);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadPaperDetails = async (paperId) => {
        setLoading(true);
        try {
            // Get Details first
            const res = await fetch(`http://localhost:4000/api/semantic/paper/${paperId}`);
            const data = await res.json();

            if (!res.ok) {
                if (res.status === 429) throw new Error("Rate limit exceeded.");
                throw new Error(data.error || "Failed to load paper details");
            }

            setPaperDetails(data);

            // Separate try/catch for secondary data to avoid blocking the main view if they fail
            try {
                // Get Citations (Forward)
                const resCit = await fetch(`http://localhost:4000/api/semantic/paper/${paperId}/citations?limit=5`);
                if (resCit.ok) {
                    const dataCit = await resCit.json();
                    setCitations(dataCit.data || []);
                }
            } catch (e) { console.error("Failed to load citations", e); }

            try {
                // Get References (Backward)
                const resRef = await fetch(`http://localhost:4000/api/semantic/paper/${paperId}/references?limit=5`);
                if (resRef.ok) {
                    const dataRef = await resRef.json();
                    setReferences(dataRef.data || []);
                }
            } catch (e) { console.error("Failed to load references", e); }

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadAuthorDetails = async (authorId) => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:4000/api/semantic/author/${authorId}`);
            const data = await res.json();

            if (!res.ok) {
                if (res.status === 429) throw new Error("Rate limit exceeded.");
                throw new Error(data.error || "Failed to load author details");
            }

            setAuthorDetails(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const onPaperClick = (paper) => {
        setSelectedPaper(paper);
        setPaperDetails(null);
        setCitations([]);
        setReferences([]);
        loadPaperDetails(paper.paperId);
    };

    const onAuthorClick = (author) => {
        setSelectedAuthor(author);
        setAuthorDetails(null);
        loadAuthorDetails(author.authorId);
    };

    const closeDetail = () => {
        setSelectedPaper(null);
        setSelectedAuthor(null);
        setPaperDetails(null);
        setAuthorDetails(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 text-gray-800 font-sans selection:bg-blue-200">

            {/* Header Section */}
            <div className="bg-white/70 backdrop-blur-md sticky top-0 z-30 border-b border-gray-200 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                            Research Hub
                        </h1>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            {['papers', 'authors'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); setResults([]); setQuery(''); }}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-2">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </div>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={activeTab === 'papers' ? "Search topics (e.g., 'Generative AI')" : "Search researchers (e.g., 'Yann LeCun')"}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-lg"
                            />
                            <button type="submit" className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
                                Search
                            </button>
                        </div>
                    </form>

                    {/* Filters (Papers only) */}
                    {activeTab === 'papers' && (
                        <div className="max-w-4xl mx-auto mt-4 px-2 py-3 bg-white/50 rounded-xl border border-gray-100 flex flex-wrap gap-4 items-center justify-center text-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 font-medium">Year:</span>
                                <input type="number" placeholder="Start" className="w-20 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500" value={yearStart} onChange={e => setYearStart(e.target.value)} />
                                <span className="text-gray-400">-</span>
                                <input type="number" placeholder="End" className="w-20 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500" value={yearEnd} onChange={e => setYearEnd(e.target.value)} />
                            </div>
                            <div className="h-4 w-px bg-gray-300 mx-2 hidden sm:block"></div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 font-medium">Field:</span>
                                <select
                                    className="px-2 py-1 border rounded bg-white focus:ring-1 focus:ring-blue-500"
                                    value={selectedField}
                                    onChange={e => setSelectedField(e.target.value)}
                                >
                                    <option value="">All Fields</option>
                                    {fieldsList.map((f, i) => <option key={i} value={f}>{f}</option>)}
                                </select>
                            </div>
                            <div className="h-4 w-px bg-gray-300 mx-2 hidden sm:block"></div>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" checked={openAccess} onChange={e => setOpenAccess(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                                <span className="text-gray-600">Open Access Only</span>
                            </label>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-6xl mx-auto px-6 py-8">

                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 mb-6 text-center">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {activeTab === 'papers' ? (
                        results.map((paper) => (
                            <PaperCard key={paper.paperId} paper={paper} onClick={onPaperClick} />
                        ))
                    ) : (
                        results.map((author) => (
                            <AuthorCard key={author.authorId} author={author} onClick={onAuthorClick} />
                        ))
                    )}
                </div>

                {!loading && results.length === 0 && query && (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-xl font-medium">No results found.</p>
                        <p className="text-sm">Try adjusting your filters or search terms.</p>
                    </div>
                )}
            </div>

            {/* Detail Overlay (Modal) */}
            {(selectedPaper || selectedAuthor) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity" onClick={closeDetail}>
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800 line-clamp-1">
                                {selectedPaper ? 'Paper Details' : 'Author Profile'}
                            </h2>
                            <button onClick={closeDetail} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        {/* Modal Content - Scrollable */}
                        <div className="overflow-y-auto p-6 flex-1">
                            {loading ? (
                                <div className="flex justify-center py-20">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                </div>
                            ) : (
                                <>
                                    {/* PAPER DETAIL VIEW */}
                                    {paperDetails && (
                                        <div className="space-y-6">
                                            <div className="border-b border-gray-100 pb-6">
                                                <h1 className="text-3xl font-bold text-gray-900 mb-3">{paperDetails.title}</h1>
                                                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                                                    <span className="font-semibold px-2 py-1 bg-gray-100 rounded">{paperDetails.year}</span>
                                                    {paperDetails.venue && <span className="px-2 py-1 bg-gray-100 rounded">{paperDetails.venue}</span>}
                                                    {paperDetails.url && (
                                                        <a href={paperDetails.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                                                            View on Semantic Scholar <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                                        </a>
                                                    )}
                                                    {paperDetails.openAccessPdf?.url && (
                                                        <a href={paperDetails.openAccessPdf.url} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline flex items-center font-medium">
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                            Download PDF
                                                        </a>
                                                    )}
                                                </div>
                                                <p className="text-gray-700 leading-relaxed text-lg">
                                                    {paperDetails.abstract || "No abstract available."}
                                                </p>
                                                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                                                    {paperDetails.authors && paperDetails.authors.map(a => (
                                                        <span key={a.authorId} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">{a.name}</span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                                        <span className="w-2 h-6 bg-purple-500 mr-2 rounded-sm"></span>
                                                        Top Citations ({citations.length}+)
                                                    </h3>
                                                    <div className="space-y-3">
                                                        {citations.map(c => (
                                                            <div key={c.paperId} className="p-3 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors">
                                                                <a href={c.url} target="_blank" rel="noreferrer" className="font-semibold text-gray-800 hover:text-blue-600 text-sm block mb-1">
                                                                    {c.title}
                                                                </a>
                                                                <div className="text-xs text-gray-500">
                                                                    {c.year} • {c.citationCount} cites
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {citations.length === 0 && <p className="text-gray-500 italic text-sm">No citations loaded.</p>}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                                        <span className="w-2 h-6 bg-indigo-500 mr-2 rounded-sm"></span>
                                                        Key References ({references.length}+)
                                                    </h3>
                                                    <div className="space-y-3">
                                                        {references.map(r => (
                                                            <div key={r.paperId} className="p-3 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors">
                                                                <a href={r.url} target="_blank" rel="noreferrer" className="font-semibold text-gray-800 hover:text-blue-600 text-sm block mb-1">
                                                                    {r.title}
                                                                </a>
                                                                <div className="text-xs text-gray-500">
                                                                    {r.year} • {r.citationCount} cites
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {references.length === 0 && <p className="text-gray-500 italic text-sm">No references loaded.</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* AUTHOR DETAIL VIEW */}
                                    {authorDetails && (
                                        <div className="text-center">
                                            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4 shadow-xl">
                                                {authorDetails.name.charAt(0)}
                                            </div>
                                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{authorDetails.name}</h1>
                                            {authorDetails.affiliations && (
                                                <p className="text-gray-600 mb-6">{authorDetails.affiliations.join(', ')}</p>
                                            )}

                                            <div className="flex justify-center gap-6 mb-8">
                                                <div className="text-center px-6 py-3 bg-blue-50 rounded-xl">
                                                    <div className="text-2xl font-bold text-blue-700">{authorDetails.paperCount}</div>
                                                    <div className="text-xs text-blue-500 font-medium uppercase tracking-wider">Publications</div>
                                                </div>
                                                <div className="text-center px-6 py-3 bg-purple-50 rounded-xl">
                                                    <div className="text-2xl font-bold text-purple-700">{authorDetails.citationCount}</div>
                                                    <div className="text-xs text-purple-500 font-medium uppercase tracking-wider">Citations</div>
                                                </div>
                                            </div>

                                            <div className="text-left">
                                                <h3 className="text-xl font-bold text-gray-900 mb-4 px-2">Recent Publications</h3>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {authorDetails.papers && authorDetails.papers.slice(0, 10).map((p, i) => (
                                                        <div key={i} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-lg hover:shadow-md transition-shadow">
                                                            <div className="flex-1 mr-4">
                                                                <h4 className="font-semibold text-gray-800 line-clamp-1">{p.title}</h4>
                                                                <span className="text-sm text-gray-500">{p.year}</span>
                                                            </div>
                                                            <div className="shrink-0">
                                                                <StatBadge label="Cites" value={p.citationCount} colorClass="bg-gray-100 text-gray-600" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SemanticScholar;
