function DataDisplay({item: props}) {
    return(
    <div className="datadisplaypage">
        <div>
            <img 
            src={props.img.src} 
            alt={props.img.alt} />

        </div>
        <div>
            <p>{props.country}</p>
            <a href={props.googleMapsLink}>View on Google Maps</a>
            <h2>{props.title}</h2>
            <p>{props.dates}</p>
            <p>{props.text}</p>
        </div>

    </div>

    );

}    
export default DataDisplay;