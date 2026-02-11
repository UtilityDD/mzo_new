/**
 * MZO Universal Organizational Hierarchy Mapping
 * 
 * Provides lookup functions for organizational hierarchy:
 * Zone → Region → Division → CCC
 * 
 * Data Source: Google Sheet (1GtWgPMm-WeDNfebubp5ac76waeZGESA2bQ8JkEpHlZ4, gid=1413090165)
 * 
 * Usage:
 *   1. Include PapaParse library before this script
 *   2. Call loadHierarchyMapping() or let it auto-load on DOMContentLoaded
 *   3. Use lookup functions: getCCCName(), getDivisionName(), etc.
 */

// Data source URL
const HIERARCHY_SHEET_URL = "https://docs.google.com/spreadsheets/d/1GtWgPMm-WeDNfebubp5ac76waeZGESA2bQ8JkEpHlZ4/export?format=csv&gid=1413090165";

// Global hierarchy data storage
let hierarchyData = [];
let hierarchyLoaded = false;

/**
 * Load hierarchy mapping from Google Sheet
 * @returns {Promise<Array>} The hierarchy data array
 */
async function loadHierarchyMapping() {
    if (hierarchyLoaded) {
        return Promise.resolve(hierarchyData);
    }

    return new Promise((resolve, reject) => {
        Papa.parse(HIERARCHY_SHEET_URL, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                // Remove duplicates based on ccc_code
                const unique = new Map();
                results.data.forEach(item => {
                    if (item.ccc_code && !unique.has(item.ccc_code)) {
                        unique.set(item.ccc_code, item);
                    }
                });

                hierarchyData = Array.from(unique.values());
                hierarchyLoaded = true;
                console.log(`✓ Loaded ${hierarchyData.length} unique hierarchy records`);
                resolve(hierarchyData);
            },
            error: (err) => {
                console.error('Failed to load hierarchy mapping:', err);
                reject(err);
            }
        });
    });
}

/**
 * Get CCC name from CCC code
 * @param {string|number} cccCode - The CCC code
 * @returns {string} CCC name or the code if not found
 */
function getCCCName(cccCode) {
    if (!cccCode) return '';
    const record = hierarchyData.find(item => item.ccc_code === String(cccCode));
    return record ? record.ccc_name : String(cccCode);
}

/**
 * Get division name from division code
 * @param {string|number} divisionCode - The division code
 * @returns {string} Division name or the code if not found
 */
function getDivisionName(divisionCode) {
    if (!divisionCode) return '';
    const record = hierarchyData.find(item => item.division_code === String(divisionCode));
    return record ? record.division_name : String(divisionCode);
}

/**
 * Get region name from region code
 * @param {string|number} regionCode - The region code
 * @returns {string} Region name or the code if not found
 */
function getRegionName(regionCode) {
    if (!regionCode) return '';
    const record = hierarchyData.find(item => item.region_code === String(regionCode));
    return record ? record.region_name : String(regionCode);
}

/**
 * Get zone name from zone code
 * @param {string|number} zoneCode - The zone code
 * @returns {string} Zone name or the code if not found
 */
function getZoneName(zoneCode) {
    if (!zoneCode) return '';
    const record = hierarchyData.find(item => item.zone_code === String(zoneCode));
    return record ? record.zone_name : String(zoneCode);
}

/**
 * Find a record by any organizational code (Zone, Region, Division, or CCC)
 * @param {string|number} code - The code to search for
 * @returns {Object|null} The first matching record found or null
 */
function getRecordByCode(code) {
    if (!code) return null;
    const codeStr = String(code);
    return hierarchyData.find(item =>
        item.ccc_code === codeStr ||
        item.division_code === codeStr ||
        item.region_code === codeStr ||
        item.zone_code === codeStr
    ) || null;
}

/**
 * Get full hierarchy information for a CCC
 * @param {string|number} cccCode - The CCC code
 * @returns {Object|null} Hierarchy object or null if not found
 */
function getFullHierarchy(cccCode) {
    if (!cccCode) return null;
    const record = hierarchyData.find(item => item.ccc_code === String(cccCode));
    if (!record) return null;

    return {
        ccc: { code: record.ccc_code, name: record.ccc_name },
        division: { code: record.division_code, name: record.division_name },
        region: { code: record.region_code, name: record.region_name },
        zone: { code: record.zone_code, name: record.zone_name }
    };
}

/**
 * Get all CCCs in a specific division
 * @param {string|number} divisionCode - The division code
 * @returns {Array<{code: string, name: string}>} Array of CCC objects
 */
function getCCCsByDivision(divisionCode) {
    if (!divisionCode) return [];

    return hierarchyData
        .filter(item => item.division_code === String(divisionCode))
        .map(item => ({
            code: item.ccc_code,
            name: item.ccc_name
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get all divisions in a specific region
 * @param {string|number} regionCode - The region code
 * @returns {Array<{code: string, name: string}>} Array of division objects
 */
function getDivisionsByRegion(regionCode) {
    if (!regionCode) return [];

    const divisions = new Map();
    hierarchyData
        .filter(item => item.region_code === String(regionCode))
        .forEach(item => {
            if (!divisions.has(item.division_code)) {
                divisions.set(item.division_code, item.division_name);
            }
        });

    return Array.from(divisions, ([code, name]) => ({ code, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get all regions
 * @returns {Array<{code: string, name: string}>} Array of region objects
 */
function getAllRegions() {
    const regions = new Map();
    hierarchyData.forEach(item => {
        if (!regions.has(item.region_code)) {
            regions.set(item.region_code, item.region_name);
        }
    });

    return Array.from(regions, ([code, name]) => ({ code, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get complete hierarchy tree
 * @returns {Object} Nested object representing the full hierarchy
 */
function getHierarchyTree() {
    const tree = {};

    hierarchyData.forEach(item => {
        const zone = item.zone_code;
        const region = item.region_code;
        const division = item.division_code;

        // Initialize zone
        if (!tree[zone]) {
            tree[zone] = {
                name: item.zone_name,
                code: zone,
                regions: {}
            };
        }

        // Initialize region
        if (!tree[zone].regions[region]) {
            tree[zone].regions[region] = {
                name: item.region_name,
                code: region,
                divisions: {}
            };
        }

        // Initialize division
        if (!tree[zone].regions[region].divisions[division]) {
            tree[zone].regions[region].divisions[division] = {
                name: item.division_name,
                code: division,
                cccs: []
            };
        }

        // Add CCC
        const cccs = tree[zone].regions[region].divisions[division].cccs;
        if (!cccs.find(c => c.code === item.ccc_code)) {
            cccs.push({
                code: item.ccc_code,
                name: item.ccc_name
            });
        }
    });

    return tree;
}

/**
 * Generate breadcrumb text for a CCC
 * @param {string|number} cccCode - The CCC code
 * @param {string} separator - Separator between levels (default: ' → ')
 * @returns {string} Breadcrumb string
 */
function generateBreadcrumb(cccCode, separator = ' → ') {
    const hierarchy = getFullHierarchy(cccCode);
    if (!hierarchy) return '';

    return [
        hierarchy.zone.name,
        hierarchy.region.name,
        hierarchy.division.name,
        hierarchy.ccc.name
    ].join(separator);
}

/**
 * Search for CCCs by name (partial match, case-insensitive)
 * @param {string} searchTerm - Search term
 * @returns {Array<Object>} Array of matching CCC records
 */
function searchCCCs(searchTerm) {
    if (!searchTerm) return [];

    const term = searchTerm.toLowerCase();
    return hierarchyData
        .filter(item =>
            item.ccc_name.toLowerCase().includes(term) ||
            item.ccc_code.includes(searchTerm)
        )
        .map(item => ({
            code: item.ccc_code,
            name: item.ccc_name,
            division: item.division_name,
            region: item.region_name
        }));
}

// Namespace export for global access
if (typeof window !== 'undefined') {
    window.MZO_HIERARCHY = {
        load: loadHierarchyMapping,
        isLoaded: () => hierarchyLoaded,
        getData: () => hierarchyData,
        getCCCName,
        getDivisionName,
        getRegionName,
        getZoneName,
        getRecordByCode,
        getFullHierarchy,
        getCCCsByDivision,
        getDivisionsByRegion,
        getAllRegions,
        getHierarchyTree,
        generateBreadcrumb,
        searchCCCs
    };

    // Auto-load on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadHierarchyMapping);
    } else {
        // DOM already loaded
        loadHierarchyMapping();
    }
}
